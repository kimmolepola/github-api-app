Worksample: GitHub API App

## How to use

1. npm install

2. Create .env file to root folder with the following content:<br>
   REACT_APP_GITHUB_ACCESS_TOKEN=[GitHub personal access token]<br>
   REACT_APP_ORGANIZATION=[GitHub organization name, e.g. google]

3. npm start

## Notes
This app is only meant as a worksample. The frontend currently exposes the GitHub token to the user on browser, which is not good. Actual production version would need a server between frontend and GitHub API in order to hide the token or other such variables for authentication.

## Architecture

The app makes a HTTP GET call to GitHub API to fetch a list of repositories and a subsequent HTTP GET call for each repository on the list to fetch related statistics. The amount of repositories to be fetched at one time is the amount of items the user has selected to be displayed per page. When the user changes page a new set of repositories and related statistics are fetched.

Each fetched page is stored in the state. Along with the content of a page the links for the next, previous, the first, and the last page are also received. This link information is stored in the state and used for fetching a new page. For the user, only the page numbers of the pages that have received the link are clickable.

When the user changes the amount of items to be displayed per page, or changes the sorting of items, the state is reset and a new list of items are fetched. Changing the view mode (table or grid view) does not reset the state.

For some statistics data, the GitHub API may respond with a server code 202. This means that the data is not yet ready. In this case, the app will try to refetch the data (five times with about five seconds in between the attempts).

(Update Aug 2021: currently GitHub API responds with code 202 for all statistics data requests with the format `https://api.github.com/repos/[ORGANIZATION]/[REPOSITORYNAME]/stats/contributors`, as used in this app).

It is suboptimal that the amount of required API calls for statistics is a factor of the amount of fetched repositories. This could be avoided by using GraphQL. GraphQL would allow to define the structure of the required data in a single API call. However, some organizations have placed OAuth App access restrictions preventing GraphQL calls to list organization repositories, and thus GraphQL was not used.

## Technologies

React
- React is a popular JavaScript library for building user interfaces. I chose it because it does the job well and I'm familiar with it.

Axios
- HTTP client. I chose Axios because it is easy to use. I also considered GitHub API v4 and GraphQL with Apollo/Client to reduce the amount of API calls. However, some organizations have placed OAuth App access restrictions preventing GraphQL calls to list organization repositories. Thus, I remained using GitHub API v3 and Axios.

Material-UI
- Material-UI is a popular JavaScript library for building React applications implementing Material Design. I chose it because because I'm familiar with it and it makes it easy to build good responsive UIs.
