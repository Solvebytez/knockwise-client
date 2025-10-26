# Environment Setup

## API Configuration

To configure the API URL for different environments, create a `.env.local` file in the root of the client directory with the following content:

### For Development:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### For Production:
```env
NEXT_PUBLIC_API_URL=https://knockwise-backend.onrender.com/api
```

## Files Updated

The following files have been updated to use the environment variable:

1. `lib/apiInstance.ts` - Main API instance configuration
2. `hooks/useSocket.ts` - Socket connection URL
3. `app/(Agent)/route-planner/page.tsx` - Route API calls

## How It Works

- The `NEXT_PUBLIC_API_URL` environment variable is used to configure the backend API URL
- If the environment variable is not set, it defaults to `http://localhost:4000/api` for development
- The socket connection automatically strips `/api` from the URL to connect to the correct socket endpoint

## Deployment

For production deployment, make sure to set the `NEXT_PUBLIC_API_URL` environment variable to your production backend URL.
