
import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, LogOut, User, Mail } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import LayoutDashboard from "@/components/dashboard/layout"

export default function DashboardPage() {
    const { user, logout, loading } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading,])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            const result = await logout()
            if (typeof result !== "undefined" && typeof result === "object" && "success" in result) {
                if ((result as { success: boolean }).success) {
                    navigate("/login");
                } else {
                    console.error("[v0] Logout failed:", (result as { error?: string }).error)
                    setIsLoggingOut(false)
                }
            } else {
                // logout returned void or unexpected type
                navigate("/login");
            }
        } catch (error) {
            console.error("[v0] Logout error:", error)
            setIsLoggingOut(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect via useEffect
    }

    const displayName = user.displayName || user.email.split("@")[0]
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    return (
        <LayoutDashboard>
            <div className="min-h-screen bg-gradient-to-br">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back, {displayName}!</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            {isLoggingOut ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing out...
                                </>
                            ) : (
                                <>
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="md:col-span-2 lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile
                                </CardTitle>
                                <CardDescription>Your account information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-lg">{displayName}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="w-fit">
                                    Active User
                                </Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Stats</CardTitle>
                                <CardDescription>Your account overview</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Account Status</span>
                                    <Badge variant="default">Active</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Member Since</span>
                                    <span className="text-sm font-medium">Today</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Last Login</span>
                                    <span className="text-sm font-medium">Just now</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Your latest actions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">Account created</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm">Logged in successfully</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm">Dashboard accessed</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </LayoutDashboard>
    )
}
