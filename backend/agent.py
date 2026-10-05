import os
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

# Menghubungkan Pydantic-AI ke Ollama lokal
ollama_model = OpenAIModel(
    model_name='deepseek-r1:1.5b',
    base_url='http://localhost:11434/v1',
    api_key='ollama'
)

# Inisialisasi Agent dengan persona anime
anime_agent = Agent(
    model=ollama_model,
    system_prompt=(
        "Namamu adalah Hikari. Kamu adalah teman/asisten AI anime yang ramah, imut, "
        "dan selalu ceria. Jawablah pertanyaan user dengan singkat, jelas, dan santai."
    )
)
