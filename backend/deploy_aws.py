"""
AWS Deployment Script for Weather Agent
This script helps deploy the LiveKit agent to AWS ECS Fargate
"""

import boto3
import json
import base64
import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class AWSDeployer:
    def __init__(self, region: str = "us-west-2"):
        self.region = region
        self.ecs_client = boto3.client('ecs', region_name=region)
        self.ecr_client = boto3.client('ecr', region_name=region)
        self.logs_client = boto3.client('logs', region_name=region)
        
    def create_ecr_repository(self, repo_name: str) -> str:
        """Create ECR repository for the agent image"""
        try:
            response = self.ecr_client.create_repository(
                repositoryName=repo_name,
                imageScanningConfiguration={'scanOnPush': True}
            )
            return response['repository']['repositoryUri']
        except self.ecr_client.exceptions.RepositoryAlreadyExistsException:
            response = self.ecr_client.describe_repositories(repositoryNames=[repo_name])
            return response['repositories'][0]['repositoryUri']
    
    def create_task_definition(self, 
                             image_uri: str, 
                             env_vars: Dict[str, str]) -> str:
        """Create ECS task definition"""
        
        # Create CloudWatch log group
        log_group_name = "/ecs/weather-agent"
        try:
            self.logs_client.create_log_group(logGroupName=log_group_name)
        except self.logs_client.exceptions.ResourceAlreadyExistsException:
            pass
        
        environment = [{"name": k, "value": v} for k, v in env_vars.items()]
        
        task_definition = {
            "family": "weather-agent",
            "networkMode": "awsvpc",
            "requiresCompatibilities": ["FARGATE"],
            "cpu": "256",
            "memory": "512",
            "executionRoleArn": f"arn:aws:iam::{self.get_account_id()}:role/ecsTaskExecutionRole",
            "containerDefinitions": [
                {
                    "name": "weather-agent",
                    "image": image_uri,
                    "essential": True,
                    "environment": environment,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": log_group_name,
                            "awslogs-region": self.region,
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]
        }
        
        response = self.ecs_client.register_task_definition(**task_definition)
        return response['taskDefinition']['taskDefinitionArn']
    
    def create_ecs_service(self, 
                          cluster_name: str,
                          task_definition_arn: str,
                          subnet_ids: list,
                          security_group_ids: list) -> str:
        """Create ECS service"""
        
        # Create cluster if it doesn't exist
        try:
            self.ecs_client.create_cluster(clusterName=cluster_name)
        except self.ecs_client.exceptions.ClusterAlreadyExistsException:
            pass
        
        service_definition = {
            "cluster": cluster_name,
            "serviceName": "weather-agent-service",
            "taskDefinition": task_definition_arn,
            "desiredCount": 1,
            "launchType": "FARGATE",
            "networkConfiguration": {
                "awsvpcConfiguration": {
                    "subnets": subnet_ids,
                    "securityGroups": security_group_ids,
                    "assignPublicIp": "ENABLED"
                }
            }
        }
        
        response = self.ecs_client.create_service(**service_definition)
        return response['service']['serviceArn']
    
    def get_account_id(self) -> str:
        """Get AWS account ID"""
        sts_client = boto3.client('sts')
        return sts_client.get_caller_identity()['Account']

def main():
    """Main deployment function"""
    deployer = AWSDeployer()
    
    # Environment variables for the agent
    env_vars = {
        "LIVEKIT_URL": os.getenv("LIVEKIT_URL", ""),
        "LIVEKIT_API_KEY": os.getenv("LIVEKIT_API_KEY", ""),
        "LIVEKIT_API_SECRET": os.getenv("LIVEKIT_API_SECRET", ""),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        "DEEPGRAM_API_KEY": os.getenv("DEEPGRAM_API_KEY", ""),
        "OPENWEATHER_API_KEY": os.getenv("OPENWEATHER_API_KEY", ""),
    }
    
    print("🚀 Starting AWS deployment...")
    
    # Step 1: Create ECR repository
    print("📦 Creating ECR repository...")
    repo_uri = deployer.create_ecr_repository("weather-agent")
    print(f"✅ ECR repository created: {repo_uri}")
    
    # Step 2: Build and push Docker image (manual step)
    print(f"""
    📋 Next steps (run these commands locally):
    
    1. Build and tag the Docker image:
       docker build -t weather-agent .
       docker tag weather-agent:latest {repo_uri}:latest
    
    2. Login to ECR and push:
       aws ecr get-login-password --region {deployer.region} | docker login --username AWS --password-stdin {repo_uri}
       docker push {repo_uri}:latest
    
    3. Update the image URI below and run the deployment again.
    """)
    
    # For demo purposes, using a placeholder image URI
    image_uri = f"{repo_uri}:latest"
    
    # Step 3: Create task definition
    print("📝 Creating ECS task definition...")
    task_def_arn = deployer.create_task_definition(image_uri, env_vars)
    print(f"✅ Task definition created: {task_def_arn}")
    
    print("""
    🎉 Deployment setup complete!
    
    To finish the deployment:
    1. Push your Docker image to ECR (see commands above)
    2. Configure your VPC subnets and security groups
    3. Create the ECS service using the task definition
    
    Estimated monthly cost: ~$5-10 for Fargate + CloudWatch logs
    """)

if __name__ == "__main__":
    main()
