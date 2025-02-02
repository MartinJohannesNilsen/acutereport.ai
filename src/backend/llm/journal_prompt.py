import requests
import json
import os

def prompt_llm_vllm_guided_json_with_medical_journal(endpoint_url:str, model_path: str, system_prompt: str, medical_journal: str):
    """
    Prompts an LLM via vllm-openai using 'guided_json' for structured medical information output.

    This function is specifically designed to extract vital medical information from
    journal entries and output it in a structured JSON format suitable for
    immediate presentation to medical professionals.

    Args:
        endpoint_url (str): The URL of the vllm-openai endpoint.
        model_path (str): The model path to use.
        system_prompt (str): The system prompt to provide to the LLM.
        medical_journal (str): The medical journal text to provide to the LLM.

    Returns:
        dict: The generated JSON response containing vital medical information,
              or None if there was an error.
    """

    # Define the JSON schema for guided_json - Medical Information Extraction
    json_schema = {
        "type": "object",
        "properties": {
            "medical_journal": {
                "type": "object",
                "properties": {
                    "critical_information": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "condition": {"type": "string", "description": "Relevant medical history condition"},
                                "details": {"type": "string", "description": "Details about the relevant medical history"},
                                "source_entries": {"type": "array", "items": {"type": "integer"}, "description": "List of journal entry numbers supporting this history"}
                            },
                            "required": ["condition", "details", "source_entries"]
                        },
                        "description": "List of relevant past medical history"
                    },
                    "current_medications": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "medication": {"type": "string", "description": "Name of the current medication"},
                                "reason": {"type": "string", "description": "Reason for medication prescription"},
                                "source_entries": {"type": "array", "items": {"type": "integer"}, "description": "List of journal entry numbers mentioning this medication"}
                            },
                            "required": ["medication", "reason", "source_entries"]
                        },
                        "description": "List of current medications"
                    },
                    "allergy_information": { 
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "allergy_name": {"type": "string", "description": "Name of the allergy"},
                                "details": {"type": "string", "description": "Further details or caveats regarding the allergy"},
                                "source_entries": {"type": "array", "items": {"type": "integer"}, "description": "List of journal entry numbers related to the allergy"}
                            },
                            "required": ["allergy_name", "details", "source_entries"]
                        },
                        "description": "List of allergies"
                    }
                },
                "required": ["critical_information", "current_medications", "allergy_information"],
                "description": "Vital medical information extracted from journal entries"
            }
        },
        "required": ["medical_journal"]
    }


    payload = {
        "model": model_path,
        "messages": [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": medical_journal.strip()}
        ],
        "guided_json": json_schema,
        "temperature": 0.0  # Set temperature to 0.0 for deterministic output
    }

    headers = {'Content-Type': 'application/json'}

    try:
        api_endpoint = endpoint_url + "/v1/chat/completions"
        print(f"Sending request to: {api_endpoint} with guided_json for medical info") # Debug print

        response = requests.post(api_endpoint, headers=headers, json=payload)
        response.raise_for_status()

        response_json = response.json()
        return response_json

    except requests.exceptions.RequestException as e:
        print(f"Error during API request to vllm-openai (medical JSON): {e}")
        print(f"Details: {e}")
        if response is not None:
            print(f"Response status code: {response.status_code}")
            print(f"Response text: {response.text}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON response from vllm-openai (medical JSON): {e}")
        if response is not None:
            print(f"Response text: {response.text}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred with vllm-openai (medical JSON): {e}")
        return None
