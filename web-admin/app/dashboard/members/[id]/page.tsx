'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Phone, Mail, User, Calendar, AlertCircle, Music, Plus, Edit2, Trash2, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface MemberDetails {
  permissions: {
    role: string | null;
    isAdmin: boolean;
    isGroupLeader: boolean;
  };
  member: {
    id: string;
    name: string;
    email: string;
    phone: string;
    birthDate: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    membershipStatus: string;
    membershipType: {
      id: string;
      name: string;
      canAccessSystem: boolean;
    } | null;
    voiceGroup: {
      id: string;
      name: string;
    } | null;
    voiceType: {
      id: string;
      name: string;
    } | null;
    memberNotes: string | null;
    additionalData: any;
    createdAt: string;
  };
  membershipPeriods: Array<{
    id: string;
    startDate: string;
    endDate: string | null;
    endReason: string | null;
    membershipType: {
      id: string;
      name: string;
    } | null;
    isCurrentPeriod: boolean;
  }>;
  leaves: Array<{
    id: string;
    startDate: string;
    endDate: string | null;
    reason: string;
    leaveType: string;
    approvalStatus: string;
    approvedBy: string | null;
    approvedAt: string | null;
    returnDate: string | null;
    notes: string | null;
    isActive: boolean;
  }>;
  recentAttendance: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    intention: string | null;
    recordedAttendance: string | null;
    reason: string | null;
    recordedAt: string | null;
    recordedBy: string | null;
  }>;
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showEndMembershipDialog, setShowEndMembershipDialog] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any>(null);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);

  useEffect(() => {
    fetchMemberDetails();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch member details');
      }

      const data = await response.json();
      setMember(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster medlemsinformasjon...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'Medlem ikke funnet'}</p>
            </div>
            <Button onClick={() => router.back()} className="mt-4">
              Tilbake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd. MMM yyyy', { locale: nb });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      quit: 'destructive',
    };
    
    const labels: Record<string, string> = {
      active: 'Aktiv',
      inactive: 'Inaktiv',
      quit: 'Sluttet',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getAttendanceBadge = (intention: string | null, recorded: string | null) => {
    if (recorded) {
      return recorded === 'present' ? (
        <Badge variant="default">Til stede</Badge>
      ) : (
        <Badge variant="secondary">Fraværende</Badge>
      );
    }
    
    if (intention) {
      return intention === 'attending' ? (
        <Badge variant="outline">Planlagt deltakelse</Badge>
      ) : (
        <Badge variant="outline">Planlagt fravær</Badge>
      );
    }
    
    return <Badge variant="outline">Ikke registrert</Badge>;
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne permisjonen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${params.id}/leaves`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete leave');
      }

      // Refresh member data
      fetchMemberDetails();
    } catch (error) {
      // Error deleting leave
      alert('Kunne ikke slette permisjon');
    }
  };

  const handleSaveLeave = async (data: any) => {
    try {
      const method = editingLeave ? 'PUT' : 'POST';
      const body = editingLeave ? { ...data, leaveId: editingLeave.id } : data;

      const response = await fetch(`/api/members/${params.id}/leaves`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save leave');
      }

      setShowLeaveDialog(false);
      setEditingLeave(null);
      fetchMemberDetails();
    } catch (error) {
      // Error saving leave
      alert('Kunne ikke lagre permisjon');
    }
  };

  const handleSavePeriod = async (data: any) => {
    try {
      const response = await fetch(`/api/members/${params.id}/periods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, periodId: editingPeriod.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to save period');
      }

      setShowPeriodDialog(false);
      setEditingPeriod(null);
      fetchMemberDetails();
    } catch (error) {
      // Error saving period
      alert('Kunne ikke lagre medlemskapsperiode');
    }
  };

  const handleEndMembership = async (data: any) => {
    try {
      const response = await fetch(`/api/members/${params.id}/periods`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to end membership');
      }

      setShowEndMembershipDialog(false);
      fetchMemberDetails();
    } catch (error) {
      // Error ending membership
      alert('Kunne ikke avslutte medlemskap');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/members')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til medlemsliste
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{member.member.name}</CardTitle>
              <CardDescription>
                Medlem siden {formatDate(member.member.createdAt)}
              </CardDescription>
            </div>
            {getStatusBadge(member.member.membershipStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Kontaktinformasjon</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{member.member.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{member.member.phone || '-'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Født: {formatDate(member.member.birthDate)}</span>
                </div>
              </div>
            </div>

            {/* Voice & Membership Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Medlemskap</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{member.member.membershipType?.name || '-'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Music className="h-4 w-4 text-gray-500" />
                  <span>
                    {member.member.voiceGroup?.name || '-'}
                    {member.member.voiceType && ` (${member.member.voiceType.name})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(member.member.emergencyContact || member.member.emergencyPhone) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-2">Nødkontakt</h3>
              <div className="space-y-1">
                <p>{member.member.emergencyContact || '-'}</p>
                <p className="text-sm text-gray-600">{member.member.emergencyPhone || '-'}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {member.member.memberNotes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-2">Notater</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{member.member.memberNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Membership Periods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Medlemskapsperioder</CardTitle>
              <CardDescription>Historikk over medlemskap</CardDescription>
            </div>
            {member.permissions.isAdmin && (
              <div className="flex items-center space-x-2">
                {member.member.membershipStatus === 'active' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowEndMembershipDialog(true)}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Avslutt medlemskap
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {member.membershipPeriods.map((period) => (
              <div
                key={period.id}
                className={`border rounded-lg p-4 ${
                  period.isCurrentPeriod ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {period.membershipType?.name || 'Ukjent type'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {period.isCurrentPeriod && (
                      <Badge variant="default">Aktiv periode</Badge>
                    )}
                    {member.permissions.isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPeriod(period);
                          setShowPeriodDialog(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {period.endReason && (
                  <p className="text-sm text-gray-600 mt-2">
                    Sluttet: {period.endReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permisjoner</CardTitle>
              <CardDescription>Oversikt over permisjoner</CardDescription>
            </div>
            {member.permissions.isGroupLeader && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingLeave(null);
                  setShowLeaveDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ny permisjon
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {member.leaves.length === 0 ? (
            <p className="text-gray-500">Ingen registrerte permisjoner</p>
          ) : (
            <div className="space-y-4">
              {member.leaves.map((leave) => (
                <div
                  key={leave.id}
                  className={`border rounded-lg p-4 ${
                    leave.isActive ? 'border-orange-500 bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{leave.reason}</p>
                    <div className="flex items-center space-x-2">
                      {leave.isActive && <Badge variant="outline">Aktiv</Badge>}
                      <Badge
                        variant={
                          leave.approvalStatus === 'approved'
                            ? 'default'
                            : leave.approvalStatus === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {leave.approvalStatus === 'approved'
                          ? 'Godkjent'
                          : leave.approvalStatus === 'rejected'
                          ? 'Avslått'
                          : 'Venter'}
                      </Badge>
                      {member.permissions.isGroupLeader && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingLeave(leave);
                              setShowLeaveDialog(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLeave(leave.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </p>
                  {leave.returnDate && (
                    <p className="text-sm text-gray-600">
                      Returnerte: {formatDate(leave.returnDate)}
                    </p>
                  )}
                  {leave.notes && (
                    <p className="text-sm text-gray-500 mt-2">{leave.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Nylig oppmøte</CardTitle>
          <CardDescription>Siste 20 arrangementer</CardDescription>
        </CardHeader>
        <CardContent>
          {member.recentAttendance.length === 0 ? (
            <p className="text-gray-500">Ingen registrert oppmøte</p>
          ) : (
            <div className="space-y-2">
              {member.recentAttendance.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{attendance.eventTitle}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(attendance.eventDate)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getAttendanceBadge(attendance.intention, attendance.recordedAttendance)}
                    {attendance.reason && (
                      <span className="text-sm text-gray-500">({attendance.reason})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveLeave({
              startDate: formData.get('startDate'),
              endDate: formData.get('endDate'),
              reason: formData.get('reason'),
              leaveType: formData.get('leaveType'),
              status: formData.get('status'),
              notes: formData.get('notes'),
              returnDate: formData.get('returnDate'),
            });
          }}>
            <DialogHeader>
              <DialogTitle>{editingLeave ? 'Rediger permisjon' : 'Ny permisjon'}</DialogTitle>
              <DialogDescription>
                {editingLeave ? 'Oppdater informasjon om permisjonen' : 'Registrer en ny permisjon for medlemmet'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdato</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={editingLeave ? editingLeave.startDate.split('T')[0] : ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Sluttdato</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={editingLeave ? editingLeave.endDate?.split('T')[0] : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveType">Type permisjon</Label>
                <Select name="leaveType" defaultValue={editingLeave?.leaveType || 'other'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maternity">Fødselspermisjon</SelectItem>
                    <SelectItem value="sick">Sykdom</SelectItem>
                    <SelectItem value="work">Jobb/reise</SelectItem>
                    <SelectItem value="other">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Årsak</Label>
                <Input
                  id="reason"
                  name="reason"
                  defaultValue={editingLeave ? editingLeave.reason : ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingLeave?.approvalStatus || 'approved'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Godkjent</SelectItem>
                    <SelectItem value="pending">Venter</SelectItem>
                    <SelectItem value="rejected">Avslått</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingLeave && (
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Returdato (hvis returnert)</Label>
                  <Input
                    id="returnDate"
                    name="returnDate"
                    type="date"
                    defaultValue={editingLeave.returnDate?.split('T')[0] || ''}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingLeave ? editingLeave.notes : ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLeaveDialog(false)}>
                Avbryt
              </Button>
              <Button type="submit">Lagre</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Period Edit Dialog */}
      {editingPeriod && (
        <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
          <DialogContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSavePeriod({
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                endReason: formData.get('endReason'),
                membershipTypeId: editingPeriod.membershipType?.id,
              });
            }}>
              <DialogHeader>
                <DialogTitle>Rediger medlemskapsperiode</DialogTitle>
                <DialogDescription>
                  Oppdater informasjon om medlemskapsperioden
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdato</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={editingPeriod.startDate.split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Sluttdato</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={editingPeriod.endDate?.split('T')[0] || ''}
                  />
                </div>
                {editingPeriod.endDate && (
                  <div className="space-y-2">
                    <Label htmlFor="endReason">Årsak for avslutning</Label>
                    <Input
                      id="endReason"
                      name="endReason"
                      defaultValue={editingPeriod.endReason || ''}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPeriodDialog(false)}>
                  Avbryt
                </Button>
                <Button type="submit">Lagre</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* End Membership Dialog */}
      <Dialog open={showEndMembershipDialog} onOpenChange={setShowEndMembershipDialog}>
        <DialogContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleEndMembership({
              endDate: formData.get('endDate'),
              endReason: formData.get('endReason'),
            });
          }}>
            <DialogHeader>
              <DialogTitle>Avslutt medlemskap</DialogTitle>
              <DialogDescription>
                Dette vil avslutte medlemmets aktive periode og endre status til &quot;Sluttet&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Sluttdato</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endReason">Årsak</Label>
                <Input
                  id="endReason"
                  name="endReason"
                  placeholder="F.eks. Flyttet, Sluttet frivillig, etc."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEndMembershipDialog(false)}>
                Avbryt
              </Button>
              <Button type="submit" variant="destructive">Avslutt medlemskap</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}