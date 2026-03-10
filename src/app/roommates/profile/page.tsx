// src/app/roommates/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth";
import {
  User,
  DollarSign,
  Calendar,
  Bed,
  Cigarette,
  PawPrint,
  Clock,
  Sparkles,
  MessageSquare,
  Users,
} from "lucide-react";

type FormData = {
  age: string;
  gender: string;
  occupation: string;
  bio: string;

  budgetMin: string;
  budgetMax: string;
  moveInDate: string;

  cleanliness: string;      // 1–5
  socialLevel: string;      // 1–5
  sleepSchedule: string;    // EARLY | FLEXIBLE | NIGHT_OWL
  smoking: boolean;
  pets: boolean;
};

export const dynamic = "force-dynamic";

export default function RoommateProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    age: "",
    gender: "",
    occupation: "",
    bio: "",

    budgetMin: "",
    budgetMax: "",
    moveInDate: "",

    cleanliness: "",
    socialLevel: "",
    sleepSchedule: "FLEXIBLE",
    smoking: false,
    pets: false,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/roommates/profile", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();

          setForm({
            age: data.age?.toString() ?? "",
            gender: data.gender ?? "",
            occupation: data.occupation ?? "",
            bio: data.bio ?? "",

            budgetMin: data.budgetMin?.toString() ?? "",
            budgetMax: data.budgetMax?.toString() ?? "",
            moveInDate: data.moveInDate
              ? new Date(data.moveInDate).toISOString().split("T")[0]
              : "",

            cleanliness: data.cleanliness?.toString() ?? "",
            socialLevel: data.socialLevel?.toString() ?? "",
            sleepSchedule: data.sleepSchedule ?? "FLEXIBLE",
            smoking: data.smoking ?? false,
            pets: data.pets ?? false,
          });
        }
      } catch (err) {
        console.error("Failed to load roommate profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const formData = new FormData();

      // Only append fields that have values (to allow partial updates)
      if (form.age) formData.append("age", form.age);
      if (form.gender) formData.append("gender", form.gender);
      if (form.occupation) formData.append("occupation", form.occupation);
      if (form.bio) formData.append("bio", form.bio);

      if (form.budgetMin) formData.append("budgetMin", form.budgetMin);
      if (form.budgetMax) formData.append("budgetMax", form.budgetMax);
      if (form.moveInDate) formData.append("moveInDate", form.moveInDate);

      if (form.cleanliness) formData.append("cleanliness", form.cleanliness);
      if (form.socialLevel) formData.append("socialLevel", form.socialLevel);
      formData.append("sleepSchedule", form.sleepSchedule);
      formData.append("smoking", form.smoking.toString());
      formData.append("pets", form.pets.toString());

      const res = await fetch("/api/roommates/profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Save failed: ${errorText}`);
      }

      // Optional: show success toast / message here in production
      console.log("Roommate profile saved successfully");

      // Redirect to roommate listings or dashboard
      router.push("/roommates");
    } catch (err) {
      console.error("Error saving profile:", err);
      // In production → show error toast
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-500">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress / Header bar */}
      <div className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-emerald-600 font-semibold">Your Profile</span>
            <span className="text-neutral-400">Listings</span>
            <span className="text-neutral-400">Matches</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">
            Complete your roommate profile
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Help potential roommates get to know you better and find the perfect match faster.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-20">
          {/* Personal Info */}
          <section className="space-y-10">
            <div className="border-t border-neutral-200 pt-16">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-8">About You</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min={18}
                    max={100}
                    placeholder="28"
                    value={form.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-neutral-700">
                    Gender
                  </Label>
                  <Input
                    id="gender"
                    placeholder="e.g. Male, Female, Non-binary, Prefer not to say"
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="occupation" className="text-sm font-medium text-neutral-700">
                    Occupation / Field of study
                  </Label>
                  <Input
                    id="occupation"
                    placeholder="e.g. Software Developer, Nursing student, Graphic Designer"
                    value={form.occupation}
                    onChange={(e) => handleChange("occupation", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Short bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others a bit about yourself, your interests, lifestyle, what you're looking for in a roommate..."
                    value={form.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    rows={5}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="space-y-10">
            <div className="border-t border-neutral-200 pt-16">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Budget & Move-in</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Min budget (CAD)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <Input
                      id="budgetMin"
                      type="number"
                      min={0}
                      placeholder="800"
                      value={form.budgetMin}
                      onChange={(e) => handleChange("budgetMin", e.target.value)}
                      className="rounded-xl border-neutral-300 pl-10 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetMax" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Max budget (CAD)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <Input
                      id="budgetMax"
                      type="number"
                      min={0}
                      placeholder="1400"
                      value={form.budgetMax}
                      onChange={(e) => handleChange("budgetMax", e.target.value)}
                      className="rounded-xl border-neutral-300 pl-10 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moveInDate" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Earliest move-in
                  </Label>
                  <Input
                    id="moveInDate"
                    type="date"
                    value={form.moveInDate}
                    onChange={(e) => handleChange("moveInDate", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Lifestyle */}
          <section className="space-y-10">
            <div className="border-t border-neutral-200 pt-16">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Lifestyle & Preferences</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <Label htmlFor="cleanliness" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Cleanliness (1–5)
                  </Label>
                  <Input
                    id="cleanliness"
                    type="number"
                    min={1}
                    max={5}
                    placeholder="3"
                    value={form.cleanliness}
                    onChange={(e) => handleChange("cleanliness", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialLevel" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Social level (1–5)
                  </Label>
                  <Input
                    id="socialLevel"
                    type="number"
                    min={1}
                    max={5}
                    placeholder="3"
                    value={form.socialLevel}
                    onChange={(e) => handleChange("socialLevel", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Sleep schedule
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {["EARLY", "FLEXIBLE", "NIGHT_OWL"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleChange("sleepSchedule", option)}
                        className={`
                          px-5 py-2.5 rounded-full text-sm font-medium transition
                          ${form.sleepSchedule === option
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}
                        `}
                      >
                        {option === "EARLY" ? "Early riser" : option === "NIGHT_OWL" ? "Night owl" : "Flexible"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cigarette className="h-5 w-5 text-neutral-600" />
                      <Label htmlFor="smoking" className="text-base font-medium">
                        I smoke
                      </Label>
                    </div>
                    <Switch
                      id="smoking"
                      checked={form.smoking}
                      onCheckedChange={(checked) => handleChange("smoking", checked)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PawPrint className="h-5 w-5 text-neutral-600" />
                      <Label htmlFor="pets" className="text-base font-medium">
                        I have pets
                      </Label>
                    </div>
                    <Switch
                      id="pets"
                      checked={form.pets}
                      onCheckedChange={(checked) => handleChange("pets", checked)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-12 border-t border-neutral-200 flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 py-6 text-base font-medium transition min-w-[200px]"
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}