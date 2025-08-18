'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { apiInstance } from '@/lib/apiInstance';
import { Calendar, Clock, MapPin, Users, User, Trash2, Eye } from 'lucide-react';

interface ScheduledAssignment {
  _id: string;
  agentId?: {
    _id: string;
    name: string;
    email: string;
  };
  teamId?: {
    _id: string;
    name: string;
  };
  zoneId: {
    _id: string;
    name: string;
  };
  scheduledDate: string;
  effectiveFrom: string;
  status: 'PENDING' | 'ACTIVATED' | 'CANCELLED';
  assignedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function ScheduledAssignments() {
  const [assignments, setAssignments] = useState<ScheduledAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'activated' | 'cancelled'>('all');

  useEffect(() => {
    fetchScheduledAssignments();
  }, []);

  const fetchScheduledAssignments = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get('/assignments/scheduled');
      
      if (response.data.success) {
        setAssignments(response.data.data);
      } else {
        toast.error('Failed to fetch scheduled assignments');
      }
    } catch (error) {
      console.error('Error fetching scheduled assignments:', error);
      toast.error('Failed to fetch scheduled assignments');
    } finally {
      setLoading(false);
    }
  };

  const cancelAssignment = async (assignmentId: string) => {
    try {
      const response = await apiInstance.put(`/assignments/scheduled/${assignmentId}/cancel`);
      
      if (response.data.success) {
        toast.success('Assignment cancelled successfully');
        fetchScheduledAssignments(); // Refresh the list
      } else {
        toast.error('Failed to cancel assignment');
      }
    } catch (error) {
      console.error('Error cancelling assignment:', error);
      toast.error('Failed to cancel assignment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'ACTIVATED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activated</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduled Assignments</h2>
          <p className="text-muted-foreground">
            Manage and monitor your scheduled territory assignments
          </p>
        </div>
        <Button onClick={fetchScheduledAssignments} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {(['all', 'pending', 'activated', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {assignments.filter(a => a.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activated</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'ACTIVATED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {assignments.filter(a => a.status === 'CANCELLED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled assignments found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {assignment.teamId ? (
                          <>
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>Team</span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 text-green-500" />
                            <span>Individual</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.zoneId.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.teamId ? (
                        <span className="font-medium">{assignment.teamId.name}</span>
                      ) : (
                        <div>
                          <div className="font-medium">{assignment.agentId?.name}</div>
                          <div className="text-sm text-muted-foreground">{assignment.agentId?.email}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(assignment.scheduledDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(assignment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // View assignment details
                            toast.info('Viewing assignment details...');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {assignment.status === 'PENDING' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Assignment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this scheduled assignment? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelAssignment(assignment._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Assignment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
