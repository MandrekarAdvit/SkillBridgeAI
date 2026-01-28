import requests

# ⚠️ PASTE YOUR KEY HERE
API_KEY = "AIzaSyCmGj9H3cN20GLFBRBtafcXE2lHPksT5J0"

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    response = requests.get(url)
    data = response.json()
    
    print("\n✅ AVAILABLE MODELS FOR YOUR KEY:")
    if 'models' in data:
        for model in data['models']:
            # We only want models that can generate text
            if "generateContent" in model['supportedGenerationMethods']:
                print(f"👉 {model['name']}")
    else:
        print("❌ No models found. Full response:", data)

except Exception as e:
    print("Error:", e)