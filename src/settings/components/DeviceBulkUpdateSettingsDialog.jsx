import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip,
  Switch,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator } from '../../common/util/permissions';
import SelectField from '../../common/components/SelectField';

const DeviceBulkUpdateSettingsDialog = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  selectedDevices,
}) => {
  const t = useTranslation();
  const admin = useAdministrator();

  const [applyToAll, setApplyToAll] = useState(true);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [deviceSettings, setDeviceSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [fields, setFields] = useState({
    groupId: '',
    phone: '',
    model: '',
    contact: '',
    vin: '',
    expirationTime: '',
    disabled: false,
  });

  const [originalFields, setOriginalFields] = useState({});

  const currentDevice = !applyToAll && selectedDevices?.length > 0
    ? selectedDevices[currentDeviceIndex]
    : null;

  const isFirstDevice = currentDeviceIndex === 0;
  const isLastDevice = selectedDevices?.length > 0 && currentDeviceIndex === selectedDevices.length - 1;
  const isDeviceEdited = (deviceId) => deviceId in deviceSettings;

  useEffect(() => {
    if (open) {
      setApplyToAll(true);
      setCurrentDeviceIndex(0);
      setDeviceSettings({});
      setHasUnsavedChanges(false);
      setFields({
        groupId: '',
        phone: '',
        model: '',
        contact: '',
        vin: '',
        expirationTime: '',
        disabled: false,
      });
      setOriginalFields({});
    }
  }, [open]);

  useEffect(() => {
    if (!applyToAll && selectedDevices?.length > 0 && currentDevice) {
      const savedSettings = deviceSettings[currentDevice.id];
      if (savedSettings) {
        setFields(savedSettings.fields);
        setOriginalFields(savedSettings.original);
        setHasUnsavedChanges(false);
      } else {
        const deviceFields = {
          groupId: currentDevice.groupId || '',
          phone: currentDevice.phone || '',
          model: currentDevice.model || '',
          contact: currentDevice.contact || '',
          vin: currentDevice.vin || '',
          expirationTime: currentDevice.expirationTime
            ? currentDevice.expirationTime.split('T')[0]
            : '',
          disabled: currentDevice.disabled || false,
        };
        setFields(deviceFields);
        setOriginalFields(deviceFields);
        setHasUnsavedChanges(false);
      }
    }
  }, [currentDeviceIndex, applyToAll, selectedDevices, deviceSettings, currentDevice]);

  const handleClose = () => {
    setApplyToAll(true);
    setCurrentDeviceIndex(0);
    setDeviceSettings({});
    setHasUnsavedChanges(false);
    setFields({
      groupId: '',
      phone: '',
      model: '',
      contact: '',
      vin: '',
      expirationTime: '',
      disabled: false,
    });
    setOriginalFields({});
    onClose();
  };

  const handleApplyToAllToggle = (event) => {
    const newValue = event.target.checked;
    setApplyToAll(newValue);
    if (newValue) {
      setCurrentDeviceIndex(0);
      setDeviceSettings({});
      setHasUnsavedChanges(false);
      setFields({
        groupId: '',
        phone: '',
        model: '',
        contact: '',
        vin: '',
        expirationTime: '',
        disabled: false,
      });
      setOriginalFields({});
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const buildPayload = (fieldValues, original) => {
    const payload = {};

    if (applyToAll) {
      if (fieldValues.groupId) payload.groupId = Number(fieldValues.groupId);
      if (fieldValues.phone) payload.phone = fieldValues.phone;
      if (fieldValues.model) payload.model = fieldValues.model;
      if (fieldValues.contact) payload.contact = fieldValues.contact;
      if (fieldValues.vin) payload.vin = fieldValues.vin;
      if (fieldValues.expirationTime) {
        payload.expirationTime = new Date(fieldValues.expirationTime).toISOString();
      }
      if (fieldValues.disabled !== undefined) {
        payload.disabled = fieldValues.disabled;
      }
    } else {
      if (fieldValues.groupId !== original.groupId) {
        payload.groupId = fieldValues.groupId ? Number(fieldValues.groupId) : null;
      }
      if (fieldValues.phone !== original.phone) {
        payload.phone = fieldValues.phone;
      }
      if (fieldValues.model !== original.model) {
        payload.model = fieldValues.model;
      }
      if (fieldValues.contact !== original.contact) {
        payload.contact = fieldValues.contact;
      }
      if (fieldValues.vin !== original.vin) {
        payload.vin = fieldValues.vin;
      }
      if (fieldValues.expirationTime !== original.expirationTime) {
        if (fieldValues.expirationTime) {
          payload.expirationTime = new Date(fieldValues.expirationTime).toISOString();
        }
      }
      if (fieldValues.disabled !== original.disabled) {
        payload.disabled = fieldValues.disabled;
      }
    }

    return payload;
  };

  const handleSaveAndNext = () => {
    setDeviceSettings((prev) => ({
      ...prev,
      [currentDevice.id]: {
        fields: { ...fields },
        original: { ...originalFields },
      },
    }));
    setHasUnsavedChanges(false);
    if (!isLastDevice) {
      setCurrentDeviceIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstDevice) {
      setCurrentDeviceIndex((prev) => prev - 1);
      setHasUnsavedChanges(false);
    }
  };

  const handleChipClick = (index) => {
    if (applyToAll) return;
    if (hasUnsavedChanges) {
      setDeviceSettings((prev) => ({
        ...prev,
        [currentDevice.id]: {
          fields: { ...fields },
          original: { ...originalFields },
        },
      }));
    }

    setCurrentDeviceIndex(index);
    setHasUnsavedChanges(false);
  };

  const handleApply = () => {
    if (applyToAll) {
      const payload = buildPayload(fields, {});
      if (Object.keys(payload).length === 0) return;
      onConfirm({ mode: 'bulk', payload });
      handleClose();
    } else {
      const finalSettings = { ...deviceSettings };
      finalSettings[currentDevice.id] = {
        fields: { ...fields },
        original: { ...originalFields },
      };

      const individualPayloads = {};
      Object.entries(finalSettings).forEach(([deviceId, settings]) => {
        const payload = buildPayload(settings.fields, settings.original);
        if (Object.keys(payload).length > 0) {
          individualPayloads[Number(deviceId)] = payload;
        }
      });
      if (Object.keys(individualPayloads).length === 0) return;
      onConfirm({ mode: 'individual', payloads: individualPayloads });
      handleClose();
    }
  };

  const canApply = applyToAll
    ? Object.values(fields).some((val) => val !== '' && val !== false)
    : Object.keys(deviceSettings).length > 0 || hasUnsavedChanges;

  const renderActionButtons = () => {
    if (applyToAll) {
      return (
        <Button
          color="primary"
          variant="contained"
          onClick={handleApply}
          disabled={!canApply}
        >
          Apply
        </Button>
      );
    }

    if (!isLastDevice) {
      return (
        <Button
          color="primary"
          variant="contained"
          onClick={handleSaveAndNext}
        >
          Save & Next
        </Button>
      );
    }

    return (
      <Button
        color="primary"
        variant="contained"
        onClick={handleApply}
        disabled={!canApply}
      >
        Save & Apply
      </Button>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('sharedQuickUpdate')}</span>
        <FormControlLabel
          control={(
            <Switch
              checked={applyToAll}
              onChange={handleApplyToAllToggle}
              color="primary"
            />
          )}
          label="Apply to all"
          labelPlacement="start"
        />
      </DialogTitle>

      <DialogContent dividers>
        {!applyToAll && hasUnsavedChanges && (
          <Box sx={{ mb: 2, p: 1, backgroundColor: '#fff3cd', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              You have unsaved changes for this device
            </Typography>
          </Box>
        )}

        {applyToAll ? (
          <Typography variant="body2" sx={{ mb: 2 }}>
            The settings will be applied to
            {' '}
            <strong>{selectedCount}</strong>
            {' '}
            device
            {selectedCount > 1 ? 's' : ''}
            .
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Update settings for Device:
            {' '}
            <strong>{currentDevice?.name || 'Unknown'}</strong>
          </Typography>
        )}

        {/* Device Chips - Only show in individual mode */}
        {!applyToAll && selectedDevices?.length > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          >
            <Typography variant="caption" color="textSecondary" sx={{ width: '100%', mb: 0.5 }}>
              Devices
            </Typography>
            {selectedDevices.map((device, index) => {
              const isCurrent = index === currentDeviceIndex;
              const isEdited = isDeviceEdited(device.id);

              return (
                <Chip
                  key={device.id}
                  label={device.name}
                  onClick={() => handleChipClick(index)}
                  onDelete={isCurrent ? undefined : () => {}}
                  deleteIcon={isEdited ? <CheckCircleIcon /> : undefined}
                  sx={{
                    cursor: 'pointer',
                    border: isCurrent ? '2px solid' : '1px solid',
                    borderColor: isCurrent ? 'primary.main' : 'divider',
                    backgroundColor: (() => {
                      if (isCurrent) return 'primary.light';
                      if (isEdited) return 'success.light';
                      return 'background.paper';
                    })(),
                    color: isCurrent ? 'primary.contrastText' : 'text.primary',
                    fontWeight: isCurrent ? 600 : 400,
                    '&:hover': {
                      backgroundColor: (() => {
                        if (isCurrent) return 'primary.main';
                        if (isEdited) return 'success.main';
                        return 'action.hover';
                      })(),
                    },
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Fields - Always visible like DevicePage */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SelectField
            value={fields.groupId}
            onChange={(event) => handleFieldChange('groupId', event.target.value)}
            endpoint="/api/groups"
            label={t('groupParent')}
          />

          <TextField
            fullWidth
            label={t('sharedPhone')}
            value={fields.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
          />

          <TextField
            fullWidth
            label={t('deviceModel')}
            value={fields.model}
            onChange={(e) => handleFieldChange('model', e.target.value)}
          />

          <TextField
            fullWidth
            label={t('deviceContact')}
            value={fields.contact}
            onChange={(e) => handleFieldChange('contact', e.target.value)}
          />

          <TextField
            fullWidth
            label={t('deviceVinNumber')}
            value={fields.vin}
            onChange={(e) => handleFieldChange('vin', e.target.value)}
          />

          {admin && (
            <>
              <TextField
                fullWidth
                label={t('userExpirationTime')}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fields.expirationTime}
                onChange={(e) => handleFieldChange('expirationTime', e.target.value)}
              />

              <FormControlLabel
                control={(
                  <Checkbox
                    checked={fields.disabled}
                    onChange={(e) => handleFieldChange('disabled', e.target.checked)}
                  />
                )}
                label={t('sharedDisabled')}
              />
            </>
          )}
        </Box>

        {/* Progress indicator for individual mode */}
        {!applyToAll && selectedDevices?.length > 0 && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            Device
            {' '}
            {currentDeviceIndex + 1}
            {' '}
            of
            {' '}
            {selectedDevices.length}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>

        {!applyToAll && !isFirstDevice && (
          <Button onClick={handlePrevious} variant="outlined">
            Previous
          </Button>
        )}

        {renderActionButtons()}
      </DialogActions>
    </Dialog>
  );
};

export default DeviceBulkUpdateSettingsDialog;
