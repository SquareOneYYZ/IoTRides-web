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

const LOCATIONIQ_API_KEY = 'Your_API_Access_Token'; // Replace with your actual API key

const GroupConnectionsPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();
  const features = useFeatures();

  const [locationOptions, setLocationOptions] = useState([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!locationQuery || locationQuery.length < 2) {
        setLocationOptions([]);
        return;
      }

      setLoadingLocations(true);
      try {
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(locationQuery)}&limit=10&dedupe=1`,
        );

        if (response.ok) {
          const data = await response.json();
          const formattedOptions = data.map((location) => ({
            id: location.place_id,
            label: location.display_name,
            type: location.type,
            osm_type: location.osm_type,
            lat: location.lat,
            lon: location.lon,
            address: location.address,
          }));
          setLocationOptions(formattedOptions);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    const debounceTimer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [locationQuery]);

  // Handle saving location connections
  const handleSaveLocations = async () => {
    try {
      const locationData = {
        groupId: id,
        cities: selectedCities,
        states: selectedStates,
        countries: selectedCountries,
      };

      // Save to your backend API
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
        {/* Zone Violation Connections */}
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

            {/* Cities */}
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                options={locationOptions.filter((loc) => loc.type === 'city' || loc.type === 'town' || loc.type === 'village')}
                value={selectedCities}
                onChange={(e, newValue) => setSelectedCities(newValue)}
                onInputChange={(e, newInputValue) => setLocationQuery(newInputValue)}
                getOptionLabel={(option) => option.label || ''}
                loading={loadingLocations}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cities"
                    placeholder="Search and select cities..."
                  />
                )}
              />
            </Box>

            {/* States */}
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                options={locationOptions.filter((loc) => loc.type === 'state' || loc.type === 'administrative')}
                value={selectedStates}
                onChange={(e, newValue) => setSelectedStates(newValue)}
                onInputChange={(e, newInputValue) => setLocationQuery(newInputValue)}
                getOptionLabel={(option) => option.label || ''}
                loading={loadingLocations}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="States"
                    placeholder="Search and select states..."
                  />
                )}
              />
            </Box>

            {/* Countries */}
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                options={locationOptions.filter((loc) => loc.type === 'country')}
                value={selectedCountries}
                onChange={(e, newValue) => setSelectedCountries(newValue)}
                onInputChange={(e, newInputValue) => setLocationQuery(newInputValue)}
                getOptionLabel={(option) => option.label || ''}
                loading={loadingLocations}
                isOptionEqualToValue={(option, value) => option.id === value.id}
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

        {/* Standard Connections */}
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
