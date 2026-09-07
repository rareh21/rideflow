"use client";

import { ProfileMenuItem } from "@/components/profile/ProfileMenuItem";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { PROFILE_NAVIGATION } from "@/config/profile-navigation";
import { useAuthorization } from "../auth/authorization-context";

export function ProfileNavigation() {
    const { hasPermission } = useAuthorization();

    return (
        <div className="mt-8 space-y-6">
            {PROFILE_NAVIGATION.map((section) => {
                const visibleItems =
                    section.items.filter((item) =>
                        hasPermission(item.permission)
                    );

                if (visibleItems.length === 0) {
                    return null;
                }

                return (
                    <ProfileSection
                        key={section.title}
                        title={section.title}
                    >
                        {visibleItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <ProfileMenuItem
                                    key={item.href}
                                    href={item.href}
                                    icon={Icon}
                                    title={item.title}
                                    description={
                                        item.description
                                    }
                                />
                            );
                        })}
                    </ProfileSection>
                );
            })}
        </div>
    );
}