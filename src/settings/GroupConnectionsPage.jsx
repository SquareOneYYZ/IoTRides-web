import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Button,
  TextField,
  Autocomplete,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkField from '../common/components/LinkField';
import { useTranslation } from '../common/components/LocalizationProvider';
import SettingsMenu from './components/SettingsMenu';
import { formatNotificationTitle } from '../common/util/formatter';
import PageLayout from '../common/components/PageLayout';
import useFeatures from '../common/util/useFeatures';
import useSettingsStyles from './common/useSettingsStyles';

const LOCATIONIQ_API_KEY = 'pk.8d53fbdaad1b9785ba8e39a1ac5e3533';

const GroupConnectionsPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();
  const features = useFeatures();

  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityQuery, setCityQuery] = useState('');
  const [stateQuery, setStateQuery] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      if (!cityQuery || cityQuery.length < 2) {
        setCityOptions([]);
        return;
      }

      setLoadingCities(true);
      try {
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(cityQuery)}&limit=10&dedupe=1`,
        );

        if (response.ok) {
          const data = await response.json();
          const filteredData = data.filter(
            (location) => location.type === 'city'
                         || location.type === 'town'
                         || location.type === 'village',
          );

          const formattedOptions = filteredData.map((location) => ({
            id: location.place_id,
            label: location.display_name,
            type: location.type,
            osm_type: location.osm_type,
            lat: location.lat,
            lon: location.lon,
            address: location.address,
          }));
          setCityOptions(formattedOptions);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };

    const debounceTimer = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounceTimer);
  }, [cityQuery]);

  useEffect(() => {
    const fetchStates = async () => {
      if (!stateQuery || stateQuery.length < 2) {
        setStateOptions([]);
        return;
      }

      setLoadingStates(true);
      try {
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(stateQuery)}&limit=10&dedupe=1`,
        );

        if (response.ok) {
          const data = await response.json();
          const filteredData = data.filter(
            (location) => location.type === 'state',
          );

          const formattedOptions = filteredData.map((location) => ({
            id: location.place_id,
            label: location.display_name,
            type: location.type,
            osm_type: location.osm_type,
            lat: location.lat,
            lon: location.lon,
            address: location.address,
          }));
          setStateOptions(formattedOptions);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoadingStates(false);
      }
    };

    const debounceTimer = setTimeout(fetchStates, 300);
    return () => clearTimeout(debounceTimer);
  }, [stateQuery]);

  useEffect(() => {
    const fetchCountries = async () => {
      if (!countryQuery || countryQuery.length < 2) {
        setCountryOptions([]);
        return;
      }

      setLoadingCountries(true);
      try {
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(countryQuery)}&limit=10&dedupe=1`,
        );

        if (response.ok) {
          const data = await response.json();
          // Filter for countries only
          const filteredData = data.filter(
            (location) => location.type === 'country',
          );

          const formattedOptions = filteredData.map((location) => ({
            id: location.place_id,
            label: location.display_name,
            type: location.type,
            osm_type: location.osm_type,
            lat: location.lat,
            lon: location.lon,
            address: location.address,
          }));
          setCountryOptions(formattedOptions);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    const debounceTimer = setTimeout(fetchCountries, 300);
    return () => clearTimeout(debounceTimer);
  }, [countryQuery]);

  const handleSaveLocations = async () => {
    try {
      const locationData = {
        groupId: id,
        cities: selectedCities,
        states: selectedStates,
        countries: selectedCountries,
      };

      const response = await fetch(`/api/groups/${id}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        console.log('Locations saved successfully');
      }
    } catch (error) {
      console.error('Error saving locations:', error);
    }
  };

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'groupDialog', 'sharedConnections']}
    >
      <Container maxWidth="xs" className={classes.container}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              Zone Violation Connections
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            {/* Geofences */}
            <LinkField
              endpointAll="/api/geofences"
              endpointLinked={`/api/geofences?groupId=${id}`}
              baseId={id}
              keyBase="groupId"
              keyLink="geofenceId"
              label={t('sharedGeofences')}
            />

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                options={cityOptions}
                value={selectedCities}
                onChange={(e, newValue) => setSelectedCities(newValue)}
                onInputChange={(e, newInputValue) => setCityQuery(newInputValue)}
                getOptionLabel={(option) => option.label || ''}
                loading={loadingCities}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={cityQuery.length < 2 ? 'Type at least 2 characters' : 'No cities found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cities"
                    placeholder="Search and select cities..."
                  />
                )}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                options={stateOptions}
                value={selectedStates}
                onChange={(e, newValue) => setSelectedStates(newValue)}
                onInputChange={(e, newInputValue) => setStateQuery(newInputValue)}
                getOptionLabel={(option) => option.label || ''}
                loading={loadingStates}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={stateQuery.length < 2 ? 'Type at least 2 characters' : 'No states found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="States"
                    placeholder="Search and select states..."
                  />
                )}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                options={countryOptions}
                value={selectedCountries}
                onChange={(e, newValue) => setSelectedCountries(newValue)}
                onInputChange={(e, newInputValue) => setCountryQuery(newInputValue)}
                getOptionLabel={(option) => option.label || ''}
                loading={loadingCountries}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={countryQuery.length < 2 ? 'Type at least 2 characters' : 'No countries found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Countries"
                    placeholder="Search and select countries..."
                  />
                )}
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveLocations}
              disabled={selectedCities.length === 0 && selectedStates.length === 0 && selectedCountries.length === 0}
              fullWidth
            >
              Save Zone Locations
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('sharedConnections')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <LinkField
              endpointAll="/api/notifications"
              endpointLinked={`/api/notifications?groupId=${id}`}
              baseId={id}
              keyBase="groupId"
              keyLink="notificationId"
              titleGetter={(it) => formatNotificationTitle(t, it)}
              label={t('sharedNotifications')}
            />
            {!features.disableDrivers && (
              <LinkField
                endpointAll="/api/drivers"
                endpointLinked={`/api/drivers?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="driverId"
                titleGetter={(it) => `${it.name} (${it.uniqueId})`}
                label={t('sharedDrivers')}
              />
            )}
            {!features.disableComputedAttributes && (
              <LinkField
                endpointAll="/api/attributes/computed"
                endpointLinked={`/api/attributes/computed?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="attributeId"
                titleGetter={(it) => it.description}
                label={t('sharedComputedAttributes')}
              />
            )}
            {!features.disableSavedCommands && (
              <LinkField
                endpointAll="/api/commands"
                endpointLinked={`/api/commands?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="commandId"
                titleGetter={(it) => it.description}
                label={t('sharedSavedCommands')}
              />
            )}
            {!features.disableMaintenance && (
              <LinkField
                endpointAll="/api/maintenance"
                endpointLinked={`/api/maintenance?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="maintenanceId"
                label={t('sharedMaintenance')}
              />
            )}
          </AccordionDetails>
        </Accordion>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => window.history.back()}
          sx={{ mt: 2 }}
        >
          {t('back') || 'Back'}
        </Button>
      </Container>
    </PageLayout>
  );
};

export default GroupConnectionsPage;
