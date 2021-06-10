import { unstable_createMuiStrictModeTheme as createMuiTheme } from '@material-ui/core/styles';

export default createMuiTheme({
  palette: {
    primary: { main: '#f04e30' },
    secondary: { main: '#f6f5f5' },
    text: {
      primary: '#595858',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    fontSize: 14,
    fontWeightLight: 350,
    fontWeightRegular: 400,
    fontWeightMedium: 600,
  },
});
