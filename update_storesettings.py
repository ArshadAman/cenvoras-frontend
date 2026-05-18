import re

file_path = "/Users/arshadaman/Cenvoras/frontend/cenvoras/src/components/StoreSettingsForm.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add country-state-city import
content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport { State, City } from 'country-state-city';")

# Update schema to require state
content = content.replace("city: Yup.string().required('City is required'),",
                          "state: Yup.string().required('State is required'),\n  city: Yup.string().required('City is required'),")

# Remove useEffect and states related to countries/cities fetching
content = re.sub(r'const \[countries, setCountries\].*?fetchCities.*?\};\s*\}', '', content, flags=re.DOTALL)
# Wait, my regex might be greedy or fail. Let's just do targeted replacements.
