import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, CheckCircle2, Building2, Map as MapIcon, Globe } from "lucide-react";
import type { ReverseGeocoding } from "@shared/schema";

interface AddressDetailsProps {
  reverseGeocoding: ReverseGeocoding;
}

export function AddressDetails({ reverseGeocoding }: AddressDetailsProps) {
  const { displayName, address, isValid, validationNotes } = reverseGeocoding;

  return (
    <Card data-testid="card-address-details">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Address Details
            </CardTitle>
            <CardDescription>
              Reverse geocoded location information
            </CardDescription>
          </div>
          {isValid ? (
            <Badge variant="default" className="gap-1" data-testid="badge-validation-valid">
              <CheckCircle2 className="h-3 w-3" />
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1" data-testid="badge-validation-invalid">
              <AlertTriangle className="h-3 w-3" />
              Warning
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Full Address */}
        <div className="space-y-2" data-testid="div-full-address">
          <div className="text-sm font-medium text-muted-foreground">Full Address</div>
          <div className="text-sm font-mono bg-muted/50 p-3 rounded-md">
            {displayName}
          </div>
        </div>

        {/* Validation Warning */}
        {!isValid && validationNotes && (
          <div className="flex gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20" data-testid="alert-validation-warning">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm text-destructive">
              {validationNotes}
            </div>
          </div>
        )}

        {/* Address Components */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Address Components</div>
          <div className="grid grid-cols-1 gap-2">
            {address.road && (
              <AddressComponent
                icon={<Building2 className="h-4 w-4" />}
                label="Street"
                value={`${address.houseNumber ? address.houseNumber + ' ' : ''}${address.road}`}
                testId="text-street"
              />
            )}
            {(address.neighbourhood || address.suburb) && (
              <AddressComponent
                icon={<MapIcon className="h-4 w-4" />}
                label="Area"
                value={address.neighbourhood || address.suburb || ''}
                testId="text-area"
              />
            )}
            {address.city && (
              <AddressComponent
                icon={<Building2 className="h-4 w-4" />}
                label="City"
                value={address.city}
                testId="text-city"
              />
            )}
            {address.county && (
              <AddressComponent
                icon={<MapIcon className="h-4 w-4" />}
                label="County"
                value={address.county}
                testId="text-county"
              />
            )}
            {address.state && (
              <AddressComponent
                icon={<MapIcon className="h-4 w-4" />}
                label="State/Province"
                value={address.state}
                testId="text-state"
              />
            )}
            {address.country && (
              <AddressComponent
                icon={<Globe className="h-4 w-4" />}
                label="Country"
                value={`${address.country} ${address.countryCode ? `(${address.countryCode})` : ''}`}
                testId="text-country"
              />
            )}
            {address.postcode && (
              <AddressComponent
                icon={<MapPin className="h-4 w-4" />}
                label="Postal Code"
                value={address.postcode}
                testId="text-postcode"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddressComponentProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  testId?: string;
}

function AddressComponent({ icon, label, value, testId }: AddressComponentProps) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-md hover-elevate active-elevate-2" data-testid={testId}>
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
