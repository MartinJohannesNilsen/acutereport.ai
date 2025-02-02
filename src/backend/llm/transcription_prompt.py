import requests
import json
import os

def prompt_llm_vllm_guided_json_with_transcription_text(endpoint_url: str, model_path: str, system_prompt: str, transcription_text: str):
    """
    Prompts an LLM via vllm-openai using ONLY 'guided_json' for JSON output and schema.

    This function uses the vllm-openai endpoint and leverages ONLY the 'guided_json'
    parameter to enforce JSON output in a specific schema.  'response_format' is removed
    as it conflicts with 'guided_json'.

    Args:
        endpoint_url (str): The URL of the vllm-openai endpoint (e.g., "http://89.169.97.156:1337").
        model_path (str): The model path to use (as configured in vllm).
        system_prompt (str): The system prompt to provide to the LLM.
        transcription_text (str): The transcription text to provide to the LLM.

    Returns:
        dict: The generated JSON response from the LLM as a Python dictionary,
              or None if there was an error.
    """

    # Define the JSON schema for guided_json (same as before)
    json_schema = {
        "type": "object",
        "properties": {
            "concise_summary": {"type": "string", "description": "Brief summary of the incident"},
            "relevant_medical_info": {"type": "array", "items": {"type": "string"}, "description": "List of relevant medical information"},
            "timeline_events": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "timestamp": {"type": "string", "description": "Timestamp of the event [MM:SS]"},
                        "description": {"type": "string", "description": "Description of the event"}
                    },
                    "required": ["timestamp", "event"]
                },
                "description": "Timeline of events"
            }
        },
        "required": ["concise_summary", "relevant_medical_info", "timeline_events"]
    }


    payload = {
        "model": model_path,
        "messages": [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": transcription_text.strip()}
        ],
        "guided_json": json_schema,              # Keep guided_json
        "temperature": 0.0
    }

    headers = {'Content-Type': 'application/json'}

    try:
        api_endpoint = endpoint_url + "/v1/chat/completions"
        print(f"Sending request to: {api_endpoint} with ONLY guided_json") # Debug print

        response = requests.post(api_endpoint, headers=headers, json=payload)
        response.raise_for_status()

        response_json = response.json()

        # Now we expect the entire response to be a JSON object based on our schema
        # We can directly return the parsed JSON
        return response_json

    except requests.exceptions.RequestException as e:
        print(f"Error during API request to vllm-openai with guided_json only: {e}")
        print(f"Details: {e}")
        if response is not None:
            print(f"Response status code: {response.status_code}")
            print(f"Response text: {response.text}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON response from vllm-openai (guided_json only): {e}")
        if response is not None:
            print(f"Response text: {response.text}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred with vllm-openai (guided_json only): {e}")
        return None
