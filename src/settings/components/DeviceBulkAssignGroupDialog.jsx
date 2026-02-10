import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DeviceBulkAssignGroupDialog = ({
  open,
  onClose,
  onConfirm,
  groups,
  selectedCount,
  selectedDevices,
}) => {
  const [applyToAll, setApplyToAll] = useState(true);
  const [groupId, setGroupId] = useState('');
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [deviceSelections, setDeviceSelections] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const sortedGroups = useMemo(
    () => Object.values(groups || {}).sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  const currentDevice = !applyToAll && selectedDevices.length > 0
    ? selectedDevices[currentDeviceIndex]
    : null;

  const isFirstDevice = currentDeviceIndex === 0;
  const isLastDevice = currentDeviceIndex === selectedDevices.length - 1;
  const isDeviceEdited = (deviceId) => deviceId in deviceSelections;
  const canApply = applyToAll
    ? groupId !== ''
    : Object.keys(deviceSelections).length > 0 || groupId !== '';

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setApplyToAll(true);
      setGroupId('');
      setCurrentDeviceIndex(0);
      setDeviceSelections({});
      setHasUnsavedChanges(false);
    }
  }, [open]);

  // Update current group when device changes
  useEffect(() => {
    if (!applyToAll && selectedDevices.length > 0) {
      const device = selectedDevices[currentDeviceIndex];
      setGroupId(deviceSelections[device.id] || '');
    }
  }, [currentDeviceIndex, applyToAll, selectedDevices, deviceSelections]);

  const handleClose = () => {
    setGroupId('');
    setApplyToAll(true);
    setCurrentDeviceIndex(0);
    setDeviceSelections({});
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleApplyToAllToggle = (event) => {
    const newValue = event.target.checked;
    setApplyToAll(newValue);
    if (newValue) {
      setGroupId('');
      setDeviceSelections({});
      setCurrentDeviceIndex(0);
      setHasUnsavedChanges(false);
    }
  };

  const handleGroupChange = (e) => {
    setGroupId(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSaveAndNext = () => {
    if (!groupId) return;

    // Save current device's selection
    setDeviceSelections((prev) => ({
      ...prev,
      [currentDevice.id]: Number(groupId),
    }));

    setHasUnsavedChanges(false);

    // Move to next device
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

    // Save current selection before switching
    if (hasUnsavedChanges && groupId) {
      setDeviceSelections((prev) => ({
        ...prev,
        [currentDevice.id]: Number(groupId),
      }));
    }

    setCurrentDeviceIndex(index);
    setHasUnsavedChanges(false);
  };

  const handleApply = () => {
    if (applyToAll) {
      // Original bulk assign logic
      if (!groupId) return;
      onConfirm(Number(groupId));
      handleClose();
    } else {
      // Individual mode - save current device then apply all
      const finalSelections = { ...deviceSelections };

      // Include current device if group is selected
      if (groupId) {
        finalSelections[currentDevice.id] = Number(groupId);
      }

      // Call onConfirm with individual selections
      onConfirm(finalSelections);
      handleClose();
    }
  };

  const renderActionButtons = () => {
    if (applyToAll) {
      return (
        <Button
          color="primary"
          variant="contained"
          onClick={handleApply}
          disabled={!groupId}
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
          disabled={!groupId}
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
        <span>Assign to Group</span>
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
            This will assign
            {' '}
            <strong>{selectedCount}</strong>
            {' '}
            device
            {selectedCount > 1 ? 's' : ''}
            {' '}
            to the selected group.
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Changes for Device:
            {' '}
            <strong>{currentDevice?.name || 'Unknown'}</strong>
          </Typography>
        )}

        {/* Device Chips - Only show in individual mode */}
        {!applyToAll && selectedDevices.length > 0 && (
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

        <FormControl fullWidth size="small">
          <InputLabel id="bulk-group-label">Group</InputLabel>
          <Select
            labelId="bulk-group-label"
            label="Group"
            value={groupId}
            onChange={handleGroupChange}
          >
            {sortedGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Progress indicator for individual mode */}
        {!applyToAll && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
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

export default DeviceBulkAssignGroupDialog;
