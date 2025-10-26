"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  testGeoNamesConnection,
  testMultipleUsernames,
} from "@/lib/testGeoNamesConnection";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function DebugGeoNamesPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [workingUsername, setWorkingUsername] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults(null);
    setWorkingUsername(null);

    try {
      console.log("Starting GeoNames connection test...");
      const success = await testGeoNamesConnection();
      setTestResults({ success, type: "connection" });
    } catch (error) {
      console.error("Test failed:", error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        type: "connection",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testUsernames = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      console.log("Testing multiple usernames...");
      const username = await testMultipleUsernames();
      setWorkingUsername(username);
      setTestResults({ success: !!username, username, type: "usernames" });
    } catch (error) {
      console.error("Username test failed:", error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        type: "usernames",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">SUCCESS</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">FAILED</Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            GeoNames API Debug
          </h1>
          <p className="text-gray-600 mt-2">
            Debug and test GeoNames API connection issues
          </p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={runConnectionTest}
          disabled={isTesting}
          className="flex items-center gap-2"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Test Current Connection
        </Button>

        <Button
          onClick={testUsernames}
          disabled={isTesting}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          Test Multiple Usernames
        </Button>
      </div>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results
              {getStatusBadge(testResults.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  {getStatusIcon(true)}
                  <span>Connection successful!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    {getStatusIcon(false)}
                    <span>Connection failed</span>
                  </div>
                  {testResults.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">
                        {testResults.error}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {testResults.type === "usernames" && testResults.username && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    <strong>Working username found:</strong>{" "}
                    {testResults.username}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Update your configuration to use this username.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>GeoNames API Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-red-600 mb-2">
                401 Authentication Error
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  Your username might not be activated - check your email for
                  activation link
                </li>
                <li>Username might be incorrect or doesn't exist</li>
                <li>Account might be suspended or expired</li>
                <li>
                  Try creating a new account at{" "}
                  <a
                    href="http://www.geonames.org/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    geonames.org
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Quick Fixes</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  Use the "demo" username for testing (limited functionality)
                </li>
                <li>Create a new GeoNames account with a different email</li>
                <li>Check if your account needs to be activated</li>
                <li>Try using HTTPS instead of HTTP (already implemented)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-2">
                Alternative Solutions
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  Use Overpass API for all location data (no authentication
                  required)
                </li>
                <li>Implement fallback to static Canadian location data</li>
                <li>
                  Use a different geocoding service (Google Places, Mapbox,
                  etc.)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Base URL:</span>
              <span className="font-mono">https://secure.geonames.org</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Username:</span>
              <span className="font-mono">sahin05</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Environment Variable:</span>
              <span className="font-mono">NEXT_PUBLIC_GEONAMES_USERNAME</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
