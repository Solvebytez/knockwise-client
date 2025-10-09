"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { testLocationAPIs, TestResult } from "@/lib/testLocationAPIs";
import { locationService } from "@/lib/locationService";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function TestLocationAPIsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testData, setTestData] = useState<any>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setTestData(null);

    try {
      const testResults = await testLocationAPIs();
      setResults(testResults);

      // Test some sample data
      const sampleData = {
        provinces: locationService.getProvinces(),
        torontoSearch: await locationService.searchMunicipalities("Toronto"),
        ontarioMunicipalities:
          await locationService.getMunicipalitiesByProvince("Ontario"),
        torontoCommunities: await locationService.getCommunitiesInMunicipality(
          "Toronto"
        ),
      };
      setTestData(sampleData);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">PASS</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">FAIL</Badge>
    );
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.service]) {
      acc[result.service] = [];
    }
    acc[result.service].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Location APIs Test
          </h1>
          <p className="text-gray-600 mt-2">
            Test GeoNames and Overpass API connections for Canadian location
            search
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isRunning ? "Running Tests..." : "Run Tests"}
        </Button>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="grid gap-6">
          {Object.entries(groupedResults).map(([service, tests]) => (
            <Card key={service}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {service}
                  <Badge variant="outline">
                    {tests.filter((t) => t.success).length}/{tests.length}{" "}
                    passed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.success)}
                        <div>
                          <p className="font-medium">{test.test}</p>
                          {test.error && (
                            <p className="text-sm text-red-600">{test.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {test.duration}ms
                        </span>
                        {getStatusBadge(test.success)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sample Data */}
      {testData && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold mb-2">
                  Provinces ({testData.provinces.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {testData.provinces
                    .slice(0, 5)
                    .map((province: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {province.name}
                      </Badge>
                    ))}
                  {testData.provinces.length > 5 && (
                    <Badge variant="outline">
                      +{testData.provinces.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  Toronto Search Results ({testData.torontoSearch.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {testData.torontoSearch
                    .slice(0, 3)
                    .map((result: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {result.name}, {result.province}
                      </Badge>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  Ontario Municipalities (
                  {testData.ontarioMunicipalities.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {testData.ontarioMunicipalities
                    .slice(0, 5)
                    .map((municipality: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {municipality.name}
                      </Badge>
                    ))}
                  {testData.ontarioMunicipalities.length > 5 && (
                    <Badge variant="outline">
                      +{testData.ontarioMunicipalities.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  Toronto Communities ({testData.torontoCommunities.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {testData.torontoCommunities
                    .slice(0, 5)
                    .map((community: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {community.name}
                      </Badge>
                    ))}
                  {testData.torontoCommunities.length > 5 && (
                    <Badge variant="outline">
                      +{testData.torontoCommunities.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">GeoNames API Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>
                  Register at{" "}
                  <a
                    href="http://www.geonames.org/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    geonames.org
                  </a>
                </li>
                <li>Get your username from your account</li>
                <li>
                  Add NEXT_PUBLIC_GEONAMES_USERNAME to your .env.local file
                </li>
                <li>Free tier: 1000 requests per day</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold">Overpass API:</h4>
              <p className="text-sm text-gray-600">
                No registration required. Uses public instance at
                overpass-api.de
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
