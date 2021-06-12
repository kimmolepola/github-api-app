import axios from 'axios';

const fetchRepositories = async ({ itemsPerPage, sort, link }) => {
  try {
    return await axios.get(
      link,
      {
        params: {
          per_page: itemsPerPage,
          sort: sort.sortBy === 'name' ? 'full_name' : 'updated',
          direction: sort.direction,
        },
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}`,
        },
      },
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default fetchRepositories;
