import makeStyles from '@mui/styles/makeStyles';
import {
  ListItemButton, ListItemIcon, ListItemText, Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import React from 'react';

const useStyles = makeStyles(() => ({
  menuItemText: {
    whiteSpace: 'nowrap',
    opacity: (props) => (props.miniVariant ? 0 : 1),
    transition: 'opacity 0.2s',
  },
  listItemButton: {
    padding: (props) => (props.miniVariant ? '12px 16px' : '10px 12px'),
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'background-color 0.2s, padding 0.2s',
    justifyContent: (props) => (props.miniVariant ? 'center' : 'flex-start'),
    minHeight: '44px',
    '&:hover': {
      backgroundColor: '#313131ff',
    },
    '&.Mui-selected': {
      backgroundColor: '#f5f5f5',
      color: '#000',
      fontWeight: 500,
      '&:hover': {
        backgroundColor: '#f5f5f5',
      },
      '& .MuiListItemIcon-root': {
        color: '#000',
      },
      '& .MuiListItemText-primary': {
        fontWeight: 500,
      },
    },
  },
  listItemIcon: {
    minWidth: (props) => (props.miniVariant ? 'auto' : '32px'),
    color: '#9ca3af',
    display: 'flex',
    justifyContent: 'center',
    transition: 'min-width 0.2s',
    '& svg': {
      fontSize: 20,
    },
  },
}));

const MenuItem = ({ title, link, icon, selected, miniVariant = false }) => {
  const classes = useStyles({ miniVariant });

  const content = (
    <ListItemButton
      key={link}
      component={Link}
      to={link}
      selected={selected}
      className={classes.listItemButton}
    >
      <ListItemIcon className={classes.listItemIcon}>{icon}</ListItemIcon>
      {!miniVariant && (
        <ListItemText
          primary={title}
          className={classes.menuItemText}
          primaryTypographyProps={{ fontSize: '14px' }}
        />
      )}
    </ListItemButton>
  );

  if (miniVariant) {
    return (
      <Tooltip title={title} placement="right" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default MenuItem;
