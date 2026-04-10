import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DropzoneArea } from 'react-mui-dropzone';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useAdministrator } from '../common/util/permissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import { useCatch } from '../reactHelper';
import useQuery from '../common/util/useQuery';
import useSettingsStyles from './common/useSettingsStyles';

const DevicePage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();
  const admin = useAdministrator();
  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);
  const query = useQuery();
  const uniqueId = query.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [vinDecodedData, setVinDecodedData] = useState(null);

  const handleFiles = useCatch(async (files) => {
    if (files.length > 0) {
      const response = await fetch(`/api/devices/${item.id}/image`, {
        method: 'POST',
        body: files[0],
      });
      if (response.ok) {
        setItem({
          ...item,
          attributes: {
            ...item.attributes,
            deviceImage: await response.text(),
          },
        });
      } else {
        throw Error(await response.text());
      }
    }
  });

  const validate = () => item && item.name && item.uniqueId;

  // Auto-fill fields when VIN data arrives (only if field is empty)
  useEffect(() => {
    if (vinDecodedData) {
      setItem((prev) => ({
        ...prev,
        // Only fill if field is empty
        make: prev.make || vinDecodedData.make || '',
        manufacturer: prev.manufacturer || vinDecodedData.manufacturer || '',
        model: prev.model || vinDecodedData.model || '',
        modelYear: prev.modelYear || vinDecodedData.modelYear || '',
        trim: prev.trim || vinDecodedData.trim || '',
        bodyClass: prev.bodyClass || vinDecodedData.bodyClass || '',
        vehicleType: prev.vehicleType || vinDecodedData.vehicleType || '',
        displacementL: prev.displacementL || vinDecodedData.displacementL || '',
        engineCylinders: prev.engineCylinders || vinDecodedData.engineCylinders || '',
        engineHP: prev.engineHP || vinDecodedData.engineHP || '',
        driveType: prev.driveType || vinDecodedData.driveType || '',
        fuelTypePrimary: prev.fuelTypePrimary || vinDecodedData.fuelTypePrimary || '',
        batteryType: prev.batteryType || vinDecodedData.batteryType || '',
      }));
    }
  }, [vinDecodedData]);

  const hasConflict = (field, suggestedValue) => {
    if (!suggestedValue) return false;
    if (!item[field]) return false;
    return item[field] !== suggestedValue;
  };

  const renderVinTextField = (field, labelKey, suggestedValue) => {
    const isConflict = hasConflict(field, suggestedValue);

    return (
      <TextField
        value={item[field] || ''}
        onChange={(event) => setItem({ ...item, [field]: event.target.value })}
        label={t(labelKey)}
        error={isConflict}
        helperText={isConflict ? `${t('vinConflict')}: ${suggestedValue}` : ''}
        sx={isConflict ? {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#f44336',
              borderWidth: '2px',
            },
          },
        } : {}}
      />
    );
  };

  return (
    <EditItemView
      endpoint="devices"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDevice']}
    >
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(event) => setItem({ ...item, name: event.target.value })}
                label={t('sharedName')}
              />
              <TextField
                value={item.uniqueId || ''}
                onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                label={t('deviceIdentifier')}
                helperText={t('deviceIdentifierHelp')}
                disabled={!admin || Boolean(uniqueId)}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <SelectField
                value={item.groupId}
                onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                endpoint="/api/groups"
                label={t('groupParent')}
              />
              <TextField
                value={item.phone || ''}
                onChange={(event) => setItem({ ...item, phone: event.target.value })}
                label={t('sharedPhone')}
              />
              <TextField
                value={item.license || ''}
                onChange={(event) => setItem({ ...item, license: event.target.value })}
                label={t('deviceLicenseNumber')}
              />

              {/* VIN Field */}
              <SelectField
                value={item.vin || ''}
                onChange={(event) => {
                  const { value: newVin, vinData } = event.target;
                  if (vinData) {
                    setVinDecodedData(vinData);
                  }
                  setItem((prev) => ({ ...prev, vin: newVin.replace(/\*/g, '') }));
                }}
                label={t('deviceVinNumber')}
                isVinField
                vinApiEndpoint="/api/devices/Vindecoder"
                fullWidth
              />
              {renderVinTextField('make', 'deviceMake', vinDecodedData?.make)}
              {renderVinTextField('manufacturer', 'deviceManufacturer', vinDecodedData?.manufacturer)}
              {renderVinTextField('model', 'deviceModel', vinDecodedData?.model)}
              {renderVinTextField('modelYear', 'deviceModelYear', vinDecodedData?.modelYear)}
              {renderVinTextField('trim', 'deviceTrim', vinDecodedData?.trim)}
              {renderVinTextField('bodyClass', 'deviceBodyClass', vinDecodedData?.bodyClass)}
              {renderVinTextField('vehicleType', 'deviceVehicleType', vinDecodedData?.vehicleType)}
              {renderVinTextField('displacementL', 'deviceDisplacementL', vinDecodedData?.displacementL)}
              {renderVinTextField('engineCylinders', 'deviceEngineCylinders', vinDecodedData?.engineCylinders)}
              {renderVinTextField('engineHP', 'deviceEngineHP', vinDecodedData?.engineHP)}
              {renderVinTextField('driveType', 'deviceDriveType', vinDecodedData?.driveType)}
              {renderVinTextField('fuelTypePrimary', 'deviceFuelTypePrimary', vinDecodedData?.fuelTypePrimary)}
              {renderVinTextField('batteryType', 'deviceBatteryType', vinDecodedData?.batteryType)}

              <TextField
                value={item.contact || ''}
                onChange={(event) => setItem({ ...item, contact: event.target.value })}
                label={t('deviceContact')}
              />
              <SelectField
                value={item.category || 'default'}
                onChange={(event) => setItem({ ...item, category: event.target.value })}
                data={deviceCategories
                  .map((category) => ({
                    id: category,
                    name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name))}
                label={t('deviceCategory')}
              />
              <SelectField
                value={item.calendarId}
                onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                endpoint="/api/calendars"
                label={t('sharedCalendar')}
              />
              {admin && (
                <SelectField
                  value={item.organizationId || ''}
                  onChange={(event) => setItem({ ...item, organizationId: event.target.value })}
                  endpoint="/api/organization"
                  label="Organization"
                />
              )}
              {admin && (
                <>
                  <TextField
                    label={t('userExpirationTime')}
                    type="date"
                    value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                    onChange={(e) => {
                      if (e.target.value) {
                        setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                      }
                    }}
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={item.disabled}
                        onChange={(event) => setItem({ ...item, disabled: event.target.checked })}
                      />
                    )}
                    label={t('sharedDisabled')}
                  />
                </>
              )}
            </AccordionDetails>
          </Accordion>

          {item.id && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{t('attributeDeviceImage')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <DropzoneArea
                  dropzoneText={t('sharedDropzoneText')}
                  acceptedFiles={['image/*']}
                  filesLimit={1}
                  onChange={handleFiles}
                  showAlerts={false}
                  maxFileSize={500000}
                />
              </AccordionDetails>
            </Accordion>
          )}

          <EditAttributesAccordion
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
          />
        </>
      )}
    </EditItemView>
  );
};

export default DevicePage;
