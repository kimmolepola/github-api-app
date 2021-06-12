import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Link,
  Collapse,
  Box,
  TableRow,
  TableCell,
  IconButton,
  Typography,
} from '@material-ui/core';
import {
  Flare as FlareIcon,
  CallSplit as CallSplitIcon,
  StarBorder as StarBorderIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@material-ui/icons';
import timeDifference from '../utils/timeDifference';
import TopCommiters from './TopCommiters';
import appContext from '../context/appContext';

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

const Row = ({ row }) => {
  const { isMobile } = useContext(appContext);
  const [open, setOpen] = useState(false);

  const classes = useRowStyles();

  return (
    <>
      <TableRow onClick={() => (isMobile ? setOpen(!open) : null)} className={classes.root}>
        <TableCell component="th" scope="row">
          <Link color="inherit" rel="noopener noreferrer" target="_blank" href={row.html_url}>
            {row.name}
          </Link>
        </TableCell>
        <TableCell>
          <TopCommiters row={row} amount={3} />
        </TableCell>
        <TableCell style={{ display: isMobile ? 'none' : '' }}>{row.language}</TableCell>
        <TableCell align="right">{timeDifference(Date.now(), new Date(row.updated_at).getTime())}</TableCell>
        <TableCell style={{ display: isMobile ? 'none' : '' }}>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <StarBorderIcon color="primary" style={{ marginRight: 5 }} /><Typography variant="body2">Stargazers: {row.stargazers_count}</Typography>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <CallSplitIcon color="primary" style={{ marginRight: 5 }} /><Typography variant="body2">Forks: {row.fork_count}</Typography>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <FlareIcon color="primary" style={{ marginRight: 5 }} /><Typography variant="body2">Created at: {(new Date(row.created_at)).toDateString()}</Typography>
              </div>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default Row;
