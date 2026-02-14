import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { FeatureFlagsSettings } from "@/components/settings/FeatureFlagsSettings";
import { PlansSettings } from "@/components/settings/PlansSettings";
import { AdminsSettings } from "@/components/settings/AdminsSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { Settings, Flag, CreditCard, Shield, Users, Package, Palette } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--surface-900)]">Settings</h1>
                <p className="text-[var(--surface-600)] mt-1">Configure platform settings, themes, and feature flags</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="theme" className="space-y-6">
                <TabsList className="bg-[var(--surface-100)] border border-[var(--surface-300)] p-1 rounded-xl flex flex-wrap gap-1">
                    <TabsTrigger
                        value="theme"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <Palette className="w-4 h-4 mr-2" />
                        Theme
                    </TabsTrigger>
                    <TabsTrigger
                        value="general"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger
                        value="feature-flags"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <Flag className="w-4 h-4 mr-2" />
                        Feature Flags
                    </TabsTrigger>
                    <TabsTrigger
                        value="plans"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Plans
                    </TabsTrigger>
                    <TabsTrigger
                        value="admins"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Admins
                    </TabsTrigger>
                    <TabsTrigger
                        value="billing"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Billing
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white rounded-lg px-4 py-2 text-[var(--surface-600)]"
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="theme">
                    <ThemeSettings />
                </TabsContent>

                <TabsContent value="general">
                    <GeneralSettings />
                </TabsContent>

                <TabsContent value="feature-flags">
                    <FeatureFlagsSettings />
                </TabsContent>

                <TabsContent value="plans">
                    <PlansSettings />
                </TabsContent>

                <TabsContent value="admins">
                    <AdminsSettings />
                </TabsContent>

                <TabsContent value="billing">
                    <BillingSettings />
                </TabsContent>

                <TabsContent value="security">
                    <SecuritySettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}

