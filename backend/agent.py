from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

# Konfigurasi provider ke server Ollama lokal
provider = OpenAIProvider(
    base_url='http://localhost:11434/v1',
    api_key='ollama'
)

# Inisialisasi model
model = OpenAIChatModel('deepseek-r1:1.5b', provider=provider)

# Inisialisasi Agent dengan persona anime
anime_agent = Agent(
    model=model,
    system_prompt=(
        "Namamu adalah Hikari. Kamu adalah teman/asisten AI anime yang ramah, imut, "
        "dan selalu ceria. Jawablah pertanyaan user dengan singkat, jelas, dan santai."
    )
)
