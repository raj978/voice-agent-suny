# Setup script for the Weather Agent backend

echo "🌤️ Setting up Weather Agent Backend..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update it with your API keys."
fi

echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run: python weather_agent.py dev"
echo ""
echo "For production deployment:"
echo "- Local: python3 weather_agent.py start"
echo "- AWS: python3 deploy_aws.py"
