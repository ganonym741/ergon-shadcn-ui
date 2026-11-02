import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '@/components/ui/theme-provider'
import { themeAccent } from '@/lib/contrast'
import { CodeBlock } from './ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Segmented } from '@/components/ui/segmented'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Statistic } from '@/components/ui/statistic'
import { Tag } from '@/components/ui/tag'
import { CheckCardPlus } from '@/components/ui/check-card-plus'
import { ConfigProvider } from '@/components/ui/config-provider'
export interface ThemeSettings {
  accent: string
  radius: number
  density: 'comfortable' | 'compact'
  direction: 'ltr' | 'rtl'
}
export const defaultSettings: ThemeSettings = {
  accent: '#b93e28',
  radius: 10,
  density: 'comfortable',
  direction: 'ltr',
}
export function ThemeControls({
  settings,
  onChange,
}: {
  settings: ThemeSettings
  onChange: (settings: ThemeSettings) => void
}) {
  const { theme, setTheme } = useTheme()
  const update = (patch: Partial<ThemeSettings>) => onChange({ ...settings, ...patch })
  return (
    <div className="theme-panel">
      <div className="theme-field">
        <h4>Accent color</h4>
        <div className="theme-swatches">
          {['#b93e28', '#4f8a6c', '#6976c5', '#9a6ab2', '#282e29'].map((c) => (
            <button
              key={c}
              aria-label={`Accent ${c}`}
              aria-pressed={settings.accent === c}
              className={settings.accent === c ? 'selected' : ''}
              style={{ background: c }}
              onClick={() => update({ accent: c })}
            />
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          Custom
          <input
            aria-label="Custom accent"
            type="color"
            value={settings.accent}
            className="h-6 w-8 rounded border bg-transparent"
            onChange={(e) => update({ accent: e.target.value })}
          />
          <span className="font-mono text-[10px]">{settings.accent}</span>
        </label>
      </div>
      <div className="theme-field">
        <h4>Appearance</h4>
        <Segmented
          label="Appearance"
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
          value={theme ?? 'system'}
          onValueChange={setTheme}
        />
      </div>
      <div className="theme-field">
        <h4 className="flex justify-between">
          Corner radius
          <span className="font-mono font-normal text-muted-foreground">{settings.radius}px</span>
        </h4>
        <Slider
          aria-label="Corner radius"
          value={[settings.radius]}
          min={0}
          max={20}
          step={2}
          onValueChange={(v) => update({ radius: v[0] })}
        />
      </div>
      <div className="theme-field">
        <h4>Density</h4>
        <Segmented
          label="Density"
          value={settings.density}
          onValueChange={(v) => update({ density: v as ThemeSettings['density'] })}
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      </div>
      <div className="theme-field">
        <h4>Component direction</h4>
        <Segmented
          label="Direction"
          value={settings.direction}
          onValueChange={(v) => update({ direction: v as ThemeSettings['direction'] })}
          options={[
            { value: 'ltr', label: 'LTR' },
            { value: 'rtl', label: 'RTL' },
          ]}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          onChange(defaultSettings)
          setTheme('light')
        }}
      >
        Reset to defaults
      </Button>
    </div>
  )
}
export function Playground({
  settings,
  onChange,
}: {
  settings: ThemeSettings
  onChange: (s: ThemeSettings) => void
}) {
  const { resolvedTheme } = useTheme()
  const [enabled, setEnabled] = React.useState(true)
  const [plan, setPlan] = React.useState(true)
  return (
    <>
      <div className="detail-heading">
        <div className="intro-eyebrow">
          <span className="dot" />
          YOURS, DOWN TO THE DETAILS
        </div>
        <h1>A little more you.</h1>
        <p>One design language. As many possibilities as you can imagine.</p>
      </div>
      <div className="playground-columns">
        <div className="theme-config">
          <div className="theme-config-header">Make it your own</div>
          <ThemeControls settings={settings} onChange={onChange} />
        </div>
        <ConfigProvider
          {...settings}
          accent={themeAccent(settings.accent, resolvedTheme)}
          className="theme-preview space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your workspace</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                A preview of your design language.
              </p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">SK</AvatarFallback>
            </Avatar>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Card>
              <CardContent className="pt-5">
                <Statistic title="Total revenue" prefix="$" value={24680} trend={12.8} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <Statistic title="Active projects" value={24} trend={8.2} />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Make room for a good idea.</CardTitle>
              <CardDescription>The details make all the difference.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="theme-name">Project name</Label>
                <Input id="theme-name" defaultValue="My next big idea" />
              </div>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  Keep the team in the loop
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Send an update when things move forward.
                  </span>
                </span>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </label>
              <div className="flex gap-2">
                <Tag color="coral">Design</Tag>
                <Tag color="green">Ready to build</Tag>
                <Tag color="purple">Team project</Tag>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" onClick={() => setEnabled(false)}>
                Cancel
              </Button>
              <Button onClick={() => setEnabled(true)}>
                Create project
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <CheckCardPlus
              title="Starter"
              description="A space for your ideas."
              checked={!plan}
              onCheckedChange={() => setPlan(false)}
            />
            <CheckCardPlus
              title="Team"
              description="Better things, together."
              checked={plan}
              onCheckedChange={() => setPlan(true)}
            />
          </div>
        </ConfigProvider>
      </div>
      <h2 className="docs-subheading">Take your theme with you</h2>
      <CodeBlock
        title="Your configuration"
        code={`import { ConfigProvider } from "@/components/ui/config-provider"\n\n<ConfigProvider accent="${settings.accent}" radius={${settings.radius}} density="${settings.density}" direction="${settings.direction}">\n  {children}\n</ConfigProvider>`}
      />
    </>
  )
}
export { DocumentPage } from './document-page'
