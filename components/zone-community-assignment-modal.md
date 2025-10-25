# Zone Community Assignment Modal

A React component for assigning zones to communities with cascading dropdown selection (Area → Municipality → Community).

## Features

- **Cascading Dropdowns**: Area → Municipality → Community selection
- **One-to-Many Relationship**: One community can have multiple zones
- **Auto-population**: Zone automatically gets area and municipality from selected community
- **Loading States**: Shows loading indicators during API calls
- **Error Handling**: Displays user-friendly error messages
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

### Basic Implementation

```tsx
import { ZoneCommunityAssignmentModal } from "@/components/zone-community-assignment-modal";

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoneId, setZoneId] = useState("");

  const handleAssignmentSuccess = (
    communityId: string,
    communityName: string
  ) => {
    console.log(`Zone assigned to ${communityName}`);
    // Proceed to next step (e.g., team assignment)
  };

  return (
    <ZoneCommunityAssignmentModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSuccess={handleAssignmentSuccess}
      zoneId={zoneId}
      zoneName="My Zone"
    />
  );
}
```

### Integration with Zone Creation Flow

```tsx
// After creating a zone
const handleZoneCreated = async (zoneData) => {
  // Show community assignment modal
  setCurrentZoneId(zoneData._id);
  setShowCommunityModal(true);
};

const handleCommunityAssigned = (
  communityId: string,
  communityName: string
) => {
  setShowCommunityModal(false);
  // Continue to team assignment
  setShowTeamAssignmentModal(true);
};
```

## Props

| Prop        | Type                                                   | Required | Description                                   |
| ----------- | ------------------------------------------------------ | -------- | --------------------------------------------- |
| `isOpen`    | `boolean`                                              | ✅       | Controls modal visibility                     |
| `onClose`   | `() => void`                                           | ✅       | Called when modal is closed                   |
| `onSuccess` | `(communityId: string, communityName: string) => void` | ✅       | Called when assignment is successful          |
| `zoneId`    | `string`                                               | ✅       | ID of the zone to assign                      |
| `zoneName`  | `string`                                               | ❌       | Display name of the zone (defaults to "Zone") |

## API Integration

The modal uses the following API endpoints:

- `GET /api/areas` - Fetch all areas
- `GET /api/areas/{areaId}/municipalities` - Fetch municipalities by area
- `GET /api/municipalities/{municipalityId}/communities` - Fetch communities by municipality
- `PUT /api/zones/{zoneId}/location` - Assign zone to community

## Data Flow

1. **Modal Opens** → Fetch areas
2. **Area Selected** → Fetch municipalities for that area
3. **Municipality Selected** → Fetch communities for that municipality
4. **Community Selected** → Enable "Save and Next" button
5. **Save Clicked** → Assign zone to community via API
6. **Success** → Call `onSuccess` callback and close modal

## Styling

The modal uses Tailwind CSS classes and follows the existing design system:

- **Primary Color**: Blue (`bg-blue-600`, `hover:bg-blue-700`)
- **Success Color**: Green (`bg-green-50`, `border-green-200`)
- **Error Color**: Red (`variant: "destructive"`)
- **Loading States**: Spinner with `Loader2` icon

## Error Handling

The modal handles various error scenarios:

- **Network Errors**: Shows toast notification
- **API Errors**: Displays user-friendly error messages
- **Validation Errors**: Prevents submission without required selections
- **Loading States**: Shows appropriate loading indicators

## Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling
- **Color Contrast**: Meets WCAG guidelines

## Dependencies

- `@/components/ui/dialog` - Modal container
- `@/components/ui/button` - Action buttons
- `@/components/ui/select` - Dropdown selectors
- `@/components/ui/radio-group` - Community selection
- `@/components/ui/label` - Form labels
- `@/hooks/use-toast` - Toast notifications
- `@/lib/api/locationApi` - API service functions
- `lucide-react` - Icons

## Testing

Use the `ZoneCommunityAssignmentDemo` component for testing:

```tsx
import { ZoneCommunityAssignmentDemo } from "@/components/zone-community-assignment-demo";

// Add to your test page
<ZoneCommunityAssignmentDemo />;
```

## Backend Requirements

Ensure the backend has the following endpoints implemented:

1. **Areas API**: `/api/areas`
2. **Municipalities API**: `/api/areas/{id}/municipalities`
3. **Communities API**: `/api/municipalities/{id}/communities`
4. **Zone Assignment API**: `/api/zones/{id}/location`

## Database Schema

The modal expects the following data structure:

```typescript
interface Area {
  _id: string;
  name: string;
  type: string;
  municipalities: string[];
}

interface Municipality {
  _id: string;
  name: string;
  type: string;
  areaId: string;
  communities: string[];
}

interface Community {
  _id: string;
  name: string;
  type: string;
  municipalityId: string;
  areaId: string;
  zoneIds: string[];
}
```

## Future Enhancements

- **Search Functionality**: Add search/filter for communities
- **Bulk Assignment**: Assign multiple zones to communities
- **Map Integration**: Show communities on map
- **Caching**: Cache API responses for better performance
- **Offline Support**: Handle offline scenarios
