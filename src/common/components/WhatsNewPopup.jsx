import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const useStyles = makeStyles((theme) => ({
  paper: {
    overflow: 'hidden',
    minWidth: 780,
    minHeight: 520,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  headerIcon: {
    color: theme.palette.primary.main,
    fontSize: 22,
  },
  content: {
    padding: 0,
    backgroundColor: theme.palette.background.default,
    maxHeight: 460,
    overflowY: 'auto',
  },
  row: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  leftPanel: {
    width: 110,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  versionText: {
    fontWeight: 700,
    fontSize: 14,
    color: theme.palette.primary.main,
  },
  rightPanel: {
    flex: 1,
    padding: theme.spacing(2, 3),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  featureTitle: {
    fontWeight: 700,
  },
  detailsText: {
    lineHeight: 1.7,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  backdrop: {
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
}));

const WhatsNewPopup = () => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    fetch('/api/feature')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setFeatures(data);
          setOpen(true);
        }
      })
      .catch((err) => console.error('[WhatsNewPopup]', err));
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      PaperProps={{ className: classes.paper }}
      BackdropProps={{ className: classes.backdrop }}
    >
      {/* ── Header ── */}
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <AutoAwesomeIcon className={classes.headerIcon} />
          <Typography variant="body1" fontWeight={700}>
            Whats New
          </Typography>
        </div>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* ── One block per API object ── */}
      <DialogContent className={classes.content}>
        {features.map((item) => (
          <Box key={item.id} className={classes.row}>
            {/* Left — versionNo */}
            <div className={classes.leftPanel}>
              <Typography className={classes.versionText}>
                {`v${item.versionNo}`}
              </Typography>
            </div>

            {/* Right — feature + details */}
            <div className={classes.rightPanel}>
              <Typography variant="body2" className={classes.featureTitle}>
                {item.feature}
              </Typography>
              <Typography variant="body2" color="textSecondary" className={classes.detailsText}>
                {item.details}
              </Typography>
            </div>
          </Box>
        ))}
      </DialogContent>

      {/* ── Footer ── */}
      <div className={classes.footer}>
        <Button size="small" variant="contained" onClick={handleClose} disableElevation>
          Got it!
        </Button>
      </div>
    </Dialog>
  );
};

export default WhatsNewPopup;
