import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Shield,
  Building2,
  Mail,
  Calendar,
  Search,
  UserCog,
  Check,
  Loader2,
  UserPlus,
  Copy,
  Link,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Role = "admin" | "department_head" | "member";

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  department_head: "Afdelingshoofd",
  member: "Medewerker",
};

const roleBadgeVariants: Record<Role, "default" | "secondary" | "outline"> = {
  admin: "default",
  department_head: "secondary",
  member: "outline",
};

export default function AdminGebruikersPage() {
  const users = useQuery(api.users.list);
  const departments = useQuery(api.departments.list);
  const updateRole = useMutation(api.users.updateRole);
  const updateDepartment = useMutation(api.users.updateDepartment);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [editingUser, setEditingUser] = useState<{
    id: Id<"users">;
    name: string;
    currentRole: Role;
    currentDepartmentId: Id<"departments">;
  } | null>(null);
  const [newRole, setNewRole] = useState<Role>("member");
  const [newDepartmentId, setNewDepartmentId] = useState<Id<"departments"> | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sign-up`
    : "";

  // Filter users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      filterDepartment === "all" || user.departmentId === filterDepartment;
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  // Get department name by ID
  const getDepartmentName = (departmentId: Id<"departments">) => {
    const dept = departments?.find((d) => d._id === departmentId);
    return dept?.name || "Onbekend";
  };

  const handleEditUser = (user: {
    _id: Id<"users">;
    name: string;
    role: Role;
    departmentId: Id<"departments">;
  }) => {
    setEditingUser({
      id: user._id,
      name: user.name,
      currentRole: user.role,
      currentDepartmentId: user.departmentId,
    });
    setNewRole(user.role);
    setNewDepartmentId(user.departmentId);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!editingUser || !newDepartmentId) return;

    setIsSaving(true);
    try {
      // Update role if changed
      if (newRole !== editingUser.currentRole) {
        await updateRole({ userId: editingUser.id, role: newRole });
      }
      // Update department if changed
      if (newDepartmentId !== editingUser.currentDepartmentId) {
        await updateDepartment({
          userId: editingUser.id,
          departmentId: newDepartmentId as Id<"departments">,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setEditingUser(null);
        setSaveSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
    setIsSaving(false);
  };

  const userStats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === "admin").length || 0,
    departmentHeads: users?.filter((u) => u.role === "department_head").length || 0,
    members: users?.filter((u) => u.role === "member").length || 0,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gebruikersbeheer</h1>
            <p className="text-muted-foreground mt-1">
              Beheer gebruikers, rollen en afdelingstoewijzingen
            </p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Uitnodigen
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Totaal</p>
                  <p className="text-2xl font-bold">{userStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{userStats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoofden</p>
                  <p className="text-2xl font-bold">{userStats.departmentHeads}</p>
                </div>
                <UserCog className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medewerkers</p>
                  <p className="text-2xl font-bold">{userStats.members}</p>
                </div>
                <Users className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Gebruikers</CardTitle>
            <CardDescription>
              Klik op een gebruiker om rol of afdeling te wijzigen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam of email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Afdeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle afdelingen</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle rollen</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="department_head">Afdelingshoofd</SelectItem>
                  <SelectItem value="member">Medewerker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Afdeling</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Geen gebruikers gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {getDepartmentName(user.departmentId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariants[user.role as Role]}>
                            {roleLabels[user.role as Role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="h-3 w-3" />
                            {user.createdAt
                              ? format(new Date(user.createdAt), "d MMM yyyy", { locale: nl })
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleEditUser({
                                _id: user._id,
                                name: user.name,
                                role: user.role as Role,
                                departmentId: user.departmentId,
                              })
                            }
                          >
                            Bewerken
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gebruiker bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de rol of afdeling van {editingUser?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Admin - Volledige toegang
                      </div>
                    </SelectItem>
                    <SelectItem value="department_head">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-purple-500" />
                        Afdelingshoofd - Afdeling beheren
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        Medewerker - Standaard toegang
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Afdeling</label>
                <Select
                  value={newDepartmentId}
                  onValueChange={(v) => setNewDepartmentId(v as Id<"departments">)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={isSaving || saveSuccess}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Opgeslagen!
                  </>
                ) : (
                  "Opslaan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite User Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gebruiker uitnodigen</DialogTitle>
              <DialogDescription>
                Deel de uitnodigingslink met nieuwe teamleden
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Uitnodigingslink</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{inviteUrl}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">Hoe het werkt:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Deel de link met je collega</li>
                  <li>Zij maken een account aan</li>
                  <li>Je ziet ze verschijnen in deze lijst</li>
                  <li>Wijs de juiste rol en afdeling toe</li>
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Sluiten
              </Button>
              <Button onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Gekopieerd!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopieer link
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
