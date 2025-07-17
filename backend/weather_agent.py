import asyncio
import logging
import os
import json
import aiohttp
from typing import Annotated
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from livekit import agents, rtc
from livekit.agents import AgentSession, Agent, JobContext, RoomInputOptions, RoomOutputOptions
from livekit.plugins import openai, silero, deepgram

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WeatherAgentClass:
    def __init__(self):
        self.weather_api_key = os.getenv("OPENWEATHER_API_KEY")
        if not self.weather_api_key:
            logger.warning("OpenWeather API key not found. Weather functionality will be limited.")
    
    async def get_weather(self, city: str = "San Ramon", state: str = "CA") -> str:
        """Get current weather for the specified city and state"""
        if not self.weather_api_key:
            return "I'm sorry, I don't have access to live weather data right now, but San Ramon typically enjoys a Mediterranean climate with warm, dry summers and mild winters!"
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"http://api.openweathermap.org/data/2.5/weather?q={city},{state},US&appid={self.weather_api_key}&units=imperial"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        temp = data['main']['temp']
                        feels_like = data['main']['feels_like']
                        humidity = data['main']['humidity']
                        description = data['weather'][0]['description']
                        wind_speed = data['wind']['speed']
                        
                        weather_report = f"""
                        Here's the current weather in {city}, {state}:
                        
                        🌡️ Temperature: {temp}°F (feels like {feels_like}°F)
                        🌤️ Conditions: {description.title()}
                        💧 Humidity: {humidity}%
                        💨 Wind Speed: {wind_speed} mph
                        
                        As someone who's lived in San Ramon for years, I can tell you this is pretty typical for our area! 
                        We're blessed with great weather year-round here in the East Bay.
                        """
                        
                        return weather_report.strip()
                    else:
                        return "I'm having trouble accessing the weather data right now, but San Ramon usually has beautiful weather!"
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            return "I'm having trouble getting the latest weather data, but San Ramon typically has wonderful Mediterranean weather!"

class WeatherAgent(agents.Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
            You are Sunny, a cheerful and knowledgeable weather expert who has lived in San Ramon, California for over 20 years. 
            You're passionate about weather patterns and love sharing insights about the local climate.
            
            Your personality:
            - Friendly, enthusiastic, and warm (like sunshine!)
            - Deep knowledge of San Ramon's weather patterns and microclimates
            - Love to share interesting weather facts and local insights
            - Always positive and helpful
            - Speak in a conversational, neighborly tone
            
            Key facts about San Ramon weather:
            - Mediterranean climate with warm, dry summers and mild winters
            - Average summer temps: 70-85°F
            - Average winter temps: 45-65°F
            - Very little rainfall from May to October
            - Occasional hot Diablo winds in fall
            - Morning fog sometimes rolls in from the Bay
            - Part of the beautiful East Bay with great weather year-round
            
            When users ask about weather, use the get_weather function to provide current conditions, 
            then add your local expertise and personality to make it engaging and informative.
            
            Keep responses conversational and not too long - this is a voice chat!
            """,
            tools=[]  # Will be set after function tool is created
        )

async def entrypoint(ctx: JobContext):
    # Check required API keys
    required_keys = {
        "DEEPGRAM_API_KEY": os.getenv("DEEPGRAM_API_KEY"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "OPENWEATHER_API_KEY": os.getenv("OPENWEATHER_API_KEY"),
    }
    missing_keys = [k for k, v in required_keys.items() if not v]
    if missing_keys:
        logger.error(f"Missing API keys: {', '.join(missing_keys)}. Set them in .env and restart.")
        return

    # Remove the initial_ctx setup since we're putting instructions in the Agent class
    weather_agent_instance = WeatherAgentClass()
    
    # Create the weather function tool
    @agents.llm.function_tool(
        name="get_current_weather",
        description="Get the current weather conditions for a specified city and state"
    )
    async def get_current_weather(
        city: str = "San Ramon",
        state: str = "CA"
    ):
        """Get the current weather conditions for a specified city and state"""
        return await weather_agent_instance.get_weather(city, state)

    # Create and start the session with STT, VAD, LLM, TTS
    session = AgentSession(
        stt=deepgram.STT(),
        vad=silero.VAD.load(),
        llm=openai.LLM(model="gpt-4o-mini", temperature=0.7),
        tts=openai.TTS(voice="nova"),
    )

    # Connect to the room FIRST (this is crucial for audio track access)
    await ctx.connect()

    # Create the agent with the function tool
    weather_agent = WeatherAgent()
    # Update the agent's tools after the function tool is created
    await weather_agent.update_tools([get_current_weather])

    # Start the session AFTER connecting to the room
    await session.start(
        room=ctx.room,
        agent=weather_agent,
        room_input_options=RoomInputOptions(
            # Optional: LiveKit Cloud enhanced noise cancellation (omit if self-hosting)
            # noise_cancellation=noise_cancellation.BVC(),
        ),
        room_output_options=RoomOutputOptions(
            transcription_enabled=True,  # Enable real-time transcriptions
            audio_enabled=True          # Keep audio enabled for speech
        ),
    )

    # Log the actual agent participant identity for debugging
    agent_identity = ctx.room.local_participant.identity
    logger.info(f"Agent connected with identity: {agent_identity}")

    # Send welcome message (as TTS and transcript)
    welcome_text = (
        "Hey there! I'm Sunny, your friendly neighborhood weather expert here in San Ramon! "
        "I've been tracking our local weather patterns for over 20 years. "
        "Ask me anything about the current weather conditions, and I'll give you all the details "
        "plus some local insights you won't get anywhere else!"
    )
    await asyncio.sleep(1)  # Brief delay for connection stability
    await session.generate_reply(instructions=welcome_text)  # This triggers TTS and on_response_chunk for transcript

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
