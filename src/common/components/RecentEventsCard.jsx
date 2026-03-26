import React from 'react';
import Draggable from 'react-draggable';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { RecentEventsSection } from './StatusCard';

const RecentEventsCard = ({ deviceId, open, onClose, onCountChange }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 200,
        bottom: 113,
        zIndex: 6,
        pointerEvents: 'none',
      }}
    >
      <Draggable handle=".drag-handle">
        <Card style={{ width: 320, pointerEvents: 'auto' }}>

          {/* Header */}
          <Box
            className="drag-handle"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={1}
            sx={{ cursor: 'move' }}
          >
            <Typography variant="subtitle2">Recent Events</Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider />

          <CardContent>
            <RecentEventsSection
              deviceId={deviceId}
              onCountChange={onCountChange}
            />
          </CardContent>

        </Card>
      </Draggable>
    </div>
  );
};

export default RecentEventsCard;
