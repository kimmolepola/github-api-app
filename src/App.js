import React from 'react';

import { useQuery, gql } from '@apollo/client';

const EXCHANGE_RATES = gql`
query {
  __schema {
    types {
      name
      kind
      description
      fields {
        name
      }
    }
  }
}
`;

function ExchangeRates() {
  const { loading, error, data } = useQuery(EXCHANGE_RATES);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  console.log('data: ', data);

  return (
    <div>
      <p>
        {JSON.stringify(data)}
      </p>
    </div>
  );
}

function App() {
  return (
    <div>
      <ExchangeRates />
    </div>
  );
}

export default App;
