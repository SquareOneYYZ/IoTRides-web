import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import TextField from '@mui/material/TextField';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import { useTranslation } from '../common/components/LocalizationProvider';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import useOrganizationAttributes from '../common/attributes/useOrganizationAttributes';
import { useCatch } from '../reactHelper';
import { organizationsActions } from '../store/organizations';
import useSettingsStyles from './common/useSettingsStyles';

const OrganizationPage = () => {
  const classes = useSettingsStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const organizationAttributes = useOrganizationAttributes(t);

  const [item, setItem] = useState();

  const onItemSaved = useCatch(async () => {
    const response = await fetch('/api/organization');
    if (response.ok) {
      dispatch(organizationsActions.refresh(await response.json()));
    } else {
      throw Error(await response.text());
    }
  });

  const validate = () => item && item.name;

  return (
    <EditItemView
      endpoint='organization'
      item={item}
      setItem={setItem}
      validate={validate}
      onItemSaved={onItemSaved}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'groupDialog']}
    >
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='subtitle1'>{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(event) =>
                  setItem({ ...item, name: event.target.value })
                }
                label={t('sharedName')}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='subtitle1'>{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <SelectField
                value={item.groupId}
                onChange={(event) =>
                  setItem({ ...item, groupId: Number(event.target.value) })
                }
                endpoint='/api/organization'
                label={t('organizationParent')}
              />
            </AccordionDetails>
          </Accordion>
          <EditAttributesAccordion
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{
              ...commonDeviceAttributes,
              ...organizationAttributes,
            }}
          />
        </>
      )}
    </EditItemView>
  );
};

export default OrganizationPage;
