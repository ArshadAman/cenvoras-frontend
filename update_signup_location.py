import re

file_path = "/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/Signup.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the static imports with country-state-city
content = content.replace("import { indianStates, citiesByState } from '../utils/indiaData';",
                          "import { State, City } from 'country-state-city';")

# 1. Update the country change handler
old_country_onChange = """onChange={(option) => {
                                        setFieldValue('country', option.value);
                                        setFieldValue('state', '');
                                        setFieldValue('city', '');
                                    }}"""

new_country_onChange = """onChange={(option) => {
                                        setFieldValue('country', option.value);
                                        setFieldValue('state', '');
                                        setFieldValue('city', '');
                                    }}"""
content = content.replace(old_country_onChange, new_country_onChange)

# 2. Update the State/City display condition
# We should show State/City for ALL countries, not just IN
content = content.replace("{values.country === 'IN' && (", "{values.country && (")

# 3. Update State dropdown options
old_state_dropdown = """<Select
                                            options={indianStates}
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            placeholder="Select State"
                                            styles={customSelectStyles}
                                            onChange={(option) => {
                                                setFieldValue('state', option.value);
                                                setFieldValue('city', ''); // Reset city when state changes
                                            }}
                                        />"""

new_state_dropdown = """<Select
                                            options={State.getStatesOfCountry(values.country).map(state => ({ value: state.isoCode, label: state.name }))}
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            placeholder="Select State"
                                            styles={customSelectStyles}
                                            onChange={(option) => {
                                                setFieldValue('state', option.value);
                                                setFieldValue('city', '');
                                            }}
                                            value={values.state ? { value: values.state, label: State.getStateByCodeAndCountry(values.state, values.country)?.name || values.state } : null}
                                        />"""

content = content.replace(old_state_dropdown, new_state_dropdown)

# 4. Update City dropdown options
old_city_dropdown = """<Select
                                            options={(citiesByState[values.state] || []).map(city => ({ value: city, label: city }))}
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            placeholder="Select City"
                                            styles={customSelectStyles}
                                            isDisabled={!values.state}
                                            onChange={(option) => setFieldValue('city', option.value)}
                                            value={values.city ? { value: values.city, label: values.city } : null}
                                        />"""

new_city_dropdown = """<Select
                                            options={City.getCitiesOfState(values.country, values.state).map(city => ({ value: city.name, label: city.name }))}
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            placeholder="Select City"
                                            styles={customSelectStyles}
                                            isDisabled={!values.state}
                                            onChange={(option) => setFieldValue('city', option.value)}
                                            value={values.city ? { value: values.city, label: values.city } : null}
                                        />"""

content = content.replace(old_city_dropdown, new_city_dropdown)

# 5. Fix schema so State is required for all countries
# Find: state: Yup.string().when('country', { ... }),
content = re.sub(
    r"state: Yup\.string\(\)\.when\('country', \{.*?\n.*?\n.*?\n\s*\}\),",
    "state: Yup.string().required('State/Region is required'),",
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

