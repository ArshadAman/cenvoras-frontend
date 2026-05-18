import re

file_path = "/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/Profile.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the static imports with country-state-city
content = content.replace("import { indianStates, citiesByState } from '../utils/indiaData';",
                          "import { State, City } from 'country-state-city';")
                          
# If it wasn't there, we just append it after React
if "import { State, City } from 'country-state-city';" not in content:
    content = content.replace("import React, { useState", "import { State, City } from 'country-state-city';\nimport React, { useState")

# 1. Update State dropdown options
old_state_dropdown = """<Select
                        options={indianStates}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select State"
                        styles={customSelectStyles}
                        value={indianStates.find(opt => opt.value === formData.state) || null}
                        onChange={(option) => {
                          handleInputChange({ target: { name: 'state', value: option.value } });
                          handleInputChange({ target: { name: 'city', value: '' } }); // Reset city
                        }}
                      />"""

new_state_dropdown = """<Select
                        options={State.getStatesOfCountry(formData.country).map(state => ({ value: state.isoCode, label: state.name }))}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select State"
                        styles={customSelectStyles}
                        value={formData.state ? { value: formData.state, label: State.getStateByCodeAndCountry(formData.state, formData.country)?.name || formData.state } : null}
                        onChange={(option) => {
                          handleInputChange({ target: { name: 'state', value: option.value } });
                          handleInputChange({ target: { name: 'city', value: '' } });
                        }}
                      />"""

content = content.replace(old_state_dropdown, new_state_dropdown)
if new_state_dropdown not in content:
    # try generic replace if whitespace is different
    content = re.sub(r'<Select[^>]+options=\{indianStates\}[^>]+/>', new_state_dropdown, content, flags=re.DOTALL)

# 2. Update City dropdown options
old_city_dropdown = """<Select
                        options={(citiesByState[formData.state] || []).map(city => ({ value: city, label: city }))}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select City"
                        styles={customSelectStyles}
                        isDisabled={!formData.state}
                        value={formData.city ? { value: formData.city, label: formData.city } : null}
                        onChange={(option) => handleInputChange({ target: { name: 'city', value: option.value } })}
                      />"""

new_city_dropdown = """<Select
                        options={City.getCitiesOfState(formData.country, formData.state).map(city => ({ value: city.name, label: city.name }))}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select City"
                        styles={customSelectStyles}
                        isDisabled={!formData.state}
                        value={formData.city ? { value: formData.city, label: formData.city } : null}
                        onChange={(option) => handleInputChange({ target: { name: 'city', value: option.value } })}
                      />"""

content = content.replace(old_city_dropdown, new_city_dropdown)

# We should make sure state and city block is shown for all countries in Profile
# It's currently `{formData.country === 'IN' && (`
content = content.replace("{formData.country === 'IN' && (", "{formData.country && (")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

