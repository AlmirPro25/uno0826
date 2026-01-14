import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { Input } from "@/components/ui/shadcn/Input";
import { Label } from "@/components/ui/shadcn/Label";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/shadcn/Dialog";
import { usersAPI } from "@/api/users";
import { User } from "@/types/auth";
import { AlertCircle, Loader, Plus, Trash2 } from "lucide-react";

interface CreateUserForm {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: string;
}

interface CreateUserPayload {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: "ADMIN" | "MEDICO" | "PACIENTE";
}

export default function AdminDashboardPage() {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await usersAPI.listUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao carregar usuários");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: CreateUserForm) => {
        if (!data.password || data.password.length < 6) {
            setError("Senha deve ter pelo menos 6 caracteres");
            return;
        }
        
        try {
            await usersAPI.createUser({
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role as "ADMIN" | "MEDICO" | "PACIENTE",
            } as any);
            setSuccess(true);
            reset();
            setOpen(false);
            fetchUsers();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao criar usuário");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
                    <p className="text-muted-foreground mt-2">Administre os usuários do sistema</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Usuário</DialogTitle>
                            <DialogDescription>Preencha os dados para criar um novo usuário</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <Input
                                    id="fullName"
                                    placeholder="João da Silva"
                                    {...register("fullName", { required: "Nome é obrigatório" })}
                                />
                                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@email.com"
                                    {...register("email", { required: "Email é obrigatório" })}
                                />
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    {...register("password", { 
                                        required: "Senha é obrigatória",
                                        minLength: { value: 6, message: "Senha deve ter pelo menos 6 caracteres" }
                                    })}
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    placeholder="(11) 98765-4321"
                                    {...register("phone", { required: "Telefone é obrigatório" })}
                                />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Papel</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register("role", { required: "Papel é obrigatório" })}
                                >
                                    <option value="">Selecione um papel</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="MEDICO">Médico</option>
                                    <option value="PACIENTE">Paciente</option>
                                </select>
                                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
                            </div>

                            <Button type="submit" className="w-full">Criar Usuário</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <Alert className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-500 bg-green-500/10">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">Usuário criado com sucesso!</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {users.map((user, index) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{user.fullName}</CardTitle>
                                        <CardDescription>{user.email}</CardDescription>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                                        user.role === "MEDICO" ? "bg-blue-100 text-blue-800" :
                                        "bg-green-100 text-green-800"
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        {user.phone || "Sem telefone"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
