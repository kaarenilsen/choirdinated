'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, UserPlus, Settings, AlertCircle, CheckCircle2, Music, FileText, Loader2 } from 'lucide-react'

interface ImportSummaryProps {
  summary: {
    totalMembers: number
    newMembers: number
    updatedMembers: number
    newVoiceGroups: string[]
    newVoiceTypes: string[]
    newMembershipTypes: string[]
    configChanges: any[]
    mappedData: any[]
  }
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

export function ImportSummary({ summary, onConfirm, onCancel, isProcessing }: ImportSummaryProps) {
  const hasConfigChanges = 
    summary.newVoiceGroups.length > 0 || 
    summary.newVoiceTypes.length > 0 || 
    summary.newMembershipTypes.length > 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totalt antall medlemmer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              <span className="text-2xl font-bold">{summary.totalMembers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nye medlemmer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{summary.newMembers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Oppdaterte medlemmer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{summary.updatedMembers}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Changes */}
      {hasConfigChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Konfigurasjonsendringer</AlertTitle>
          <AlertDescription>
            Følgende verdier vil bli lagt til i systemet ditt
          </AlertDescription>
        </Alert>
      )}

      {summary.newVoiceGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Nye stemmegrupper
            </CardTitle>
            <CardDescription>
              Disse stemmegruppene finnes ikke i systemet og vil bli opprettet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.newVoiceGroups.map(group => (
                <Badge key={group} variant="secondary">
                  {group}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary.newVoiceTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Nye stemmetyper
            </CardTitle>
            <CardDescription>
              Disse stemmetypene finnes ikke i systemet og vil bli opprettet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.newVoiceTypes.map(type => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary.newMembershipTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nye medlemskapstyper
            </CardTitle>
            <CardDescription>
              Disse medlemskapstypene finnes ikke i systemet og vil bli opprettet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.newMembershipTypes.map(type => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show unmapped fields if any */}
      {summary.mappedData.length > 0 && summary.mappedData[0]._unmappedFields && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ekstra felt som blir lagret
            </CardTitle>
            <CardDescription>
              Følgende felt fra kildesystemet har ingen direkte mapping, men blir lagret for fremtidig bruk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(summary.mappedData[0]._unmappedFields).map(field => (
                <Badge key={field} variant="secondary">
                  {field}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Disse feltene kan konfigureres som ekstra datapunkter på medlemmer senere.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Forhåndsvisning av medlemmer</CardTitle>
          <CardDescription>
            De første 10 medlemmene som vil bli importert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Stemmegruppe</TableHead>
                  <TableHead>Medlemskapstype</TableHead>
                  <TableHead>Fødselsdato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.mappedData.slice(0, 10).map((member, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.voiceGroup}
                        {member.voiceType && ` - ${member.voiceType}`}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.membershipType}</TableCell>
                    <TableCell>{member.birthDate || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {summary.mappedData.length > 10 && (
            <p className="text-sm text-muted-foreground mt-4">
              ...og {summary.mappedData.length - 10} medlemmer til
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Klar for import
          </CardTitle>
          <CardDescription>
            Sjekk at alt ser riktig ut før du starter importen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Dette vil skje når du bekrefter:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>{summary.newMembers} nye medlemmer vil bli opprettet</span>
                </li>
                {summary.updatedMembers > 0 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>{summary.updatedMembers} eksisterende medlemmer vil bli oppdatert</span>
                  </li>
                )}
                {hasConfigChanges && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Nye verdier for stemmegrupper og medlemskapstyper vil bli lagt til</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Alle medlemmer vil få tilgang til systemet</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importerer...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Start import
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}