import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import makeStyles from '@mui/styles/makeStyles';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles((theme) => ({
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2, 3),
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    minWidth: theme.spacing(40),
  },
  actions: {
    padding: theme.spacing(2, 3),
    gap: theme.spacing(1),
  },
}));

const OtpModal = ({ open, onClose, onSubmit, error }) => {
  const classes = useStyles();
  const [code, setCode] = useState('');
  const t = useTranslation();

  const handleSubmit = () => {
    onSubmit(code);
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle disableTypography className={classes.title}>
        <Typography variant="h6">{t('loginTotpCode')}</Typography>
        <IconButton size="small" onClick={handleClose} style={{ color: 'inherit' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.content}>
        <Typography variant="body2" color="textSecondary">
          Enter the 6-digit code from your authenticator app.
        </Typography>
        <TextField
          autoFocus
          required
          error={error}
          label={t('loginTotpCode')}
          name="code"
          value={code}
          type="number"
          helperText={error && 'Invalid or expired code'}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && code && handleSubmit()}
          fullWidth
        />
      </DialogContent>

      <DialogActions className={classes.actions}>
        <Button onClick={handleClose} color="primary">
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="secondary"
          disabled={!code}
        >
          {t('loginLogin')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpModal;
