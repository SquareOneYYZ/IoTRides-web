import React, { useEffect, useState, useRef } from 'react';
import {
  FormControl, InputLabel, MenuItem, Select, Autocomplete, TextField, Tooltip, CircularProgress,
} from '@mui/material';
import { useEffectAsync } from '../../reactHelper';

const formatVINInput = (value) => value
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .slice(0, 17);

const padVINForApiCall = (vin) => {
  if (!vin) return '';
  const formatted = formatVINInput(vin);
  return formatted.length < 17 ? `${formatted}*` : formatted;
};

const SelectField = ({
  label,
  fullWidth,
  multiple,
  value = null,
  emptyValue = null,
  emptyTitle = '',
  onChange,
  endpoint,
  data,
  keyGetter = (item) => item.id,
  titleGetter = (item) => item.name,
  renderValue,
  MenuProps,
  sx,
  isVinField = false,
  vinApiEndpoint = '/api/devices/Vindecoder',
}) => {
  const [items, setItems] = useState();
  const [vinLoading, setVinLoading] = useState(false);
  const [vinInputValue, setVinInputValue] = useState('');
  const [vinSuggestions, setVinSuggestions] = useState([]);
  const [vinOpen, setVinOpen] = useState(false);

  const vinApiEndpointRef = useRef(vinApiEndpoint);
  const onChangeRef = useRef(onChange);
  const debounceTimer = useRef(null);

  useEffect(() => { vinApiEndpointRef.current = vinApiEndpoint; }, [vinApiEndpoint]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (isVinField) {
      const clean = (value || '').replace(/\*/g, '');
      if (clean !== vinInputValue) setVinInputValue(clean);
    }
  }, [isVinField, value]);

  const getOptionLabel = (option) => {
    if (typeof option !== 'object') {
      option = items.find((obj) => keyGetter(obj) === option);
    }
    return option ? titleGetter(option) : emptyTitle;
  };

  useEffect(() => setItems(data), [data]);

  useEffectAsync(async () => {
    if (endpoint) {
      const response = await fetch(endpoint);
      if (response.ok) {
        const fetchedData = await response.json();
        if (endpoint === '/api/notifications/types') {
          const FilteredTypes = ['deviceFuelDrop', 'deviceFuelIncrease', 'textMessage', 'driverChanged', 'media'];
          setItems(fetchedData.filter((item) => !FilteredTypes.includes(item.type)));
        } else {
          setItems(fetchedData);
        }
      } else {
        throw Error(await response.text());
      }
    }
  }, []);

  const fetchVinSuggestions = useRef(async (searchValue) => {
    setVinLoading(true);
    try {
      const paddedVin = padVINForApiCall(searchValue);
      const response = await fetch(`${vinApiEndpointRef.current}/${paddedVin}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const responseData = await response.json();
      const list = Array.isArray(responseData) ? responseData : [responseData];
      const valid = list.filter((s) => s && s.vin);

      setVinSuggestions(valid);
      setVinOpen(valid.length > 0);
    } catch (error) {
      setVinSuggestions([]);
      setVinOpen(false);
    } finally {
      setVinLoading(false);
    }
  }).current;

  const debouncedFetch = (searchValue) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchVinSuggestions(searchValue), 500);
  };

  const handleVinInputChange = (event, newInputValue, reason) => {
    if (reason === 'reset') return;

    const formatted = formatVINInput(newInputValue);
    setVinInputValue(formatted);

    if (formatted.length >= 5) {
      debouncedFetch(formatted);
    } else {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setVinSuggestions([]);
      setVinOpen(false);
    }
  };

  const handleVinSelect = (event, selectedOption) => {
    if (!selectedOption) return;
    setVinOpen(false);

    onChangeRef.current({
      target: {
        value: vinInputValue,
        vinData: typeof selectedOption === 'object' ? selectedOption : null,
      },
    });
  };

  const handleVinBlur = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (vinInputValue) {
      const clean = vinInputValue.replace(/\*/g, '');
      onChangeRef.current({ target: { value: clean } });
    }
    setVinOpen(false);
  };

  const getVinHelperText = () => {
    if (vinLoading) return 'Searching VIN...';
    if (vinInputValue.length > 0 && vinInputValue.length < 5) {
      return `Enter ${5 - vinInputValue.length} more character(s) to search`;
    }
    return `${vinInputValue.length}/17 characters`;
  };

  if (isVinField) {
    return (
      <FormControl fullWidth={fullWidth}>
        <Autocomplete
          freeSolo
          open={vinOpen}
          onClose={() => setVinOpen(false)}
          options={vinSuggestions}
          loading={vinLoading}
          inputValue={vinInputValue}
          filterOptions={(x) => x}
          getOptionLabel={(option) => (typeof option === 'object' ? option.vin : option)}
          onChange={handleVinSelect}
          onInputChange={handleVinInputChange}
          onBlur={handleVinBlur}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option.vin}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{option.vin}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {[option.modelYear, option.make, option.model, option.vehicleType]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            </MenuItem>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              helperText={getVinHelperText()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '13px',
                  '& fieldset': { borderRadius: '13px' },
                },
                ...sx,
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {vinLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </FormControl>
    );
  }

  if (items) {
    return (
      <FormControl fullWidth={fullWidth}>
        {multiple ? (
          <>
            <InputLabel>{label}</InputLabel>
            <Select
              label={label}
              multiple
              value={value}
              onChange={onChange}
              renderValue={renderValue}
              MenuProps={MenuProps}
              sx={{
                borderRadius: '13px',
                '& .MuiOutlinedInput-notchedOutline': { borderRadius: '13px' },
                ...sx,
              }}
            >
              {items.map((item) => (
                <MenuItem key={keyGetter(item)} value={keyGetter(item)}>
                  <Tooltip title={titleGetter(item)} placement="right" arrow>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      width: '100%',
                    }}
                    >
                      {titleGetter(item)}
                    </span>
                  </Tooltip>
                </MenuItem>
              ))}
            </Select>
          </>
        ) : (
          <Autocomplete
            size="small"
            options={items}
            getOptionLabel={getOptionLabel}
            renderOption={(props, option) => (
              <MenuItem {...props} key={keyGetter(option)} value={keyGetter(option)}>
                <Tooltip title={titleGetter(option)} placement="right" arrow>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    width: '100%',
                  }}
                  >
                    {titleGetter(option)}
                  </span>
                </Tooltip>
              </MenuItem>
            )}
            isOptionEqualToValue={(option, val) => keyGetter(option) === val}
            value={value}
            onChange={(_, val) => onChange({ target: { value: val ? keyGetter(val) : emptyValue } })}
            renderInput={(params) => {
              const displayValue = getOptionLabel(value);
              return (
                <Tooltip title={displayValue || ''} placement="bottom-start" arrow>
                  <TextField
                    {...params}
                    label={label}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '13px',
                        '& fieldset': { borderRadius: '13px' },
                      },
                      ...sx,
                    }}
                  />
                </Tooltip>
              );
            }}
          />
        )}
      </FormControl>
    );
  }
  return null;
};

export default SelectField;
