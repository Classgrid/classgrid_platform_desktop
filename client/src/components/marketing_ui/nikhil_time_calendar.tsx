import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Clock, Calendar as CalendarIcon, ChevronDownIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { cn } from "@/lib/utils";

// ── Single mode props (original behavior) ──
interface SingleModeProps {
  mode?: "single";
  value?: Date;
  onChange: (date: Date | undefined) => void;
  // Range props not used
  startValue?: never;
  endValue?: never;
  onRangeApply?: never;
}

// ── Range mode props (new Vercel-like behavior) ──
interface RangeModeProps {
  mode: "range";
  startValue?: Date;
  endValue?: Date;
  onRangeApply: (start: Date, end: Date) => void;
  // Single props not used
  value?: never;
  onChange?: never;
}

type NikhilTimeCalendarProps = (SingleModeProps | RangeModeProps) & {
  placeholder?: string;
  className?: string;
  popDirection?: "up" | "down" | "left" | "right";
};

// Completely custom Select component that perfectly matches the styling
// but uses absolutely zero portals, guaranteeing no Base UI / Radix conflicts
function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  dropdownClassName,
  dropUp = false
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  dropUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Use capture phase to ensure we close before other listeners fire
    document.addEventListener("mousedown", onClick, true);
    return () => document.removeEventListener("mousedown", onClick, true);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full text-sm">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Don't bubble to Popover
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:ring-1 focus:ring-ring",
          className
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div 
          className={cn(
            "absolute z-[1000] max-h-56 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            dropUp ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top",
            dropdownClassName
          )}
          // Prevent click inside dropdown from bubbling
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-1">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onValueChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === opt.value ? "bg-accent/50 text-accent-foreground font-medium" : ""
                )}
              >
                {value === opt.value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                )}
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function NikhilTimeCalendar(props: NikhilTimeCalendarProps) {
  const {
    placeholder,
    className,
    popDirection = "down",
  } = props;

  const isRange = props.mode === "range";

  // ════════════════════════════════════════════════════════════════
  //  RANGE MODE
  // ════════════════════════════════════════════════════════════════
  if (isRange) {
    return (
      <RangeMode
        startValue={props.startValue}
        endValue={props.endValue}
        onRangeApply={props.onRangeApply}
        placeholder={placeholder || "Select Date Range"}
        className={className}
        popDirection={popDirection}
      />
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  SINGLE MODE (original behavior — unchanged)
  // ════════════════════════════════════════════════════════════════
  return (
    <SingleMode
      value={props.value}
      onChange={props.onChange}
      placeholder={placeholder || "Pick date & time"}
      className={className}
      popDirection={popDirection}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SINGLE MODE component (exact original NikhilTimeCalendar behavior)
// ════════════════════════════════════════════════════════════════════════
function SingleMode({
  value,
  onChange,
  placeholder,
  className,
  popDirection,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  className?: string;
  popDirection: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
  const validValue = isValidDate(value) ? value : undefined;

  const [internalDate, setInternalDate] = useState<Date | undefined>(validValue);
  const [hour, setHour] = useState(validValue ? format(validValue, "hh") : "10");
  const [minute, setMinute] = useState(validValue ? format(validValue, "mm") : "00");
  const [ampm, setAmpm] = useState(validValue ? format(validValue, "a") : "AM");

  useEffect(() => {
    if (isValidDate(value)) {
      const validVal = value as Date;
      setInternalDate(validVal);
      setHour(format(validVal, "hh"));
      setMinute(format(validVal, "mm"));
      setAmpm(format(validVal, "a"));
    }
  }, [value]);

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState((internalDate || new Date()).getMonth().toString());
  const [selectedYear, setSelectedYear] = useState((internalDate || new Date()).getFullYear().toString());

  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const v = (i + 1).toString().padStart(2, "0");
    return { label: v, value: v };
  });
  
  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    const v = i.toString().padStart(2, "0");
    return { label: v, value: v };
  });
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const monthOptions = monthNames.map((m, i) => ({ label: m, value: i.toString() }));
  
  const yearOptions = Array.from({ length: 100 }, (_, i) => {
    const v = (currentYear + i).toString();
    return { label: v, value: v };
  });

  const ampmOptions = [
    { label: "AM", value: "AM" },
    { label: "PM", value: "PM" }
  ];

  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    const newDate = new Date(parseInt(selectedYear), parseInt(val), 1);
    setInternalDate(newDate);
  };

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    const newDate = new Date(parseInt(val), parseInt(selectedMonth), 1);
    setInternalDate(newDate);
  };

  const handleApply = () => {
    const baseDate = internalDate || new Date();
    const finalDate = new Date(baseDate);
    let h = parseInt(hour);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    finalDate.setHours(h);
    finalDate.setMinutes(parseInt(minute));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    onChange(finalDate);
    setIsOpen(false);
  };

  const displayString = isValidDate(value)
    ? `${format(value as Date, "MMM do, yyyy")} at ${format(value as Date, "hh:mm a")}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-border bg-background hover:bg-accent/50 overflow-hidden",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate min-w-0">{displayString}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side={popDirection === "up" ? "top" : popDirection === "down" ? "bottom" : popDirection as any}
        sideOffset={8}
        className="w-auto p-0 border-none shadow-2xl rounded-xl bg-transparent z-[1000] nikhil-time-calendar-portal"
      >
        <div
          className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl w-[320px] flex flex-col"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Custom Month/Year Header */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <CustomSelect 
                value={selectedMonth} 
                onValueChange={handleMonthChange} 
                options={monthOptions}
                className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                dropdownClassName="w-40 -ml-2"
              />
            </div>
            <div className="flex-1">
              <CustomSelect 
                value={selectedYear} 
                onValueChange={handleYearChange} 
                options={yearOptions}
                className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                dropdownClassName="w-32"
              />
            </div>
          </div>

          {/* Calendar Section */}
          <div className="px-3 pb-3">
            <Calendar
              mode="single"
              month={internalDate || new Date()}
              onMonthChange={setInternalDate}
              selected={internalDate}
              fixedWeeks={true}
              showOutsideDays={true}
              onSelect={(d) => {
                if (d) {
                  setInternalDate(d);
                  setSelectedMonth(d.getMonth().toString());
                  setSelectedYear(d.getFullYear().toString());
                }
              }}
              className="bg-transparent p-0 mt-3 flex justify-center"
              classNames={{
                months: "bg-transparent",
                month: "bg-transparent",
                month_caption: "hidden",
                nav: "hidden",
                caption: "hidden",
                table: "w-full border-collapse space-y-1 mx-auto",
              }}
            />
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Time Picker Section */}
          <div className="p-4 flex flex-col gap-3 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Clock size={16} />
              <span>Select Time</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-[2]">
                <CustomSelect 
                  value={hour} 
                  onValueChange={setHour} 
                  options={hourOptions}
                  className="h-9 border-border bg-background font-medium"
                  dropUp={true}
                />
              </div>
              <span className="text-lg font-bold text-muted-foreground pb-1">:</span>
              <div className="flex-[2]">
                <CustomSelect 
                  value={minute} 
                  onValueChange={setMinute} 
                  options={minuteOptions}
                  className="h-9 border-border bg-background font-medium"
                  dropUp={true}
                />
              </div>
              <div className="w-2" />
              <div className="flex-[2]">
                <CustomSelect 
                  value={ampm} 
                  onValueChange={setAmpm} 
                  options={ampmOptions}
                  className="h-9 border-none bg-emerald-500/10 text-emerald-500 font-bold hover:bg-emerald-500/20"
                  dropUp={true}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-3 bg-muted/20 border-t border-border rounded-b-xl">
            <Button
              type="button"
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium"
              onClick={handleApply}
            >
              Apply Date &amp; Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  RANGE MODE component (Vercel-style: one calendar, Start + End)
// ════════════════════════════════════════════════════════════════════════
function RangeMode({
  startValue,
  endValue,
  onRangeApply,
  placeholder,
  className,
  popDirection,
}: {
  startValue?: Date;
  endValue?: Date;
  onRangeApply: (start: Date, end: Date) => void;
  placeholder: string;
  className?: string;
  popDirection: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(isValidDate(startValue) ? startValue! : now);

  // Which field the calendar click applies to
  const [activeField, setActiveField] = useState<"start" | "end">("start");

  // Internal start
  const [startDay, setStartDay] = useState<Date | undefined>(isValidDate(startValue) ? startValue : undefined);
  const [startTime, setStartTime] = useState(isValidDate(startValue) ? format(startValue!, "HH:mm") : "00:00");

  // Internal end
  const [endDay, setEndDay] = useState<Date | undefined>(isValidDate(endValue) ? endValue : undefined);
  const [endTime, setEndTime] = useState(isValidDate(endValue) ? format(endValue!, "HH:mm") : "23:59");

  // Month/Year header
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(calendarMonth.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(calendarMonth.getFullYear().toString());

  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const monthOptions = monthNames.map((m, i) => ({ label: m, value: i.toString() }));
  const yearOptions = Array.from({ length: 100 }, (_, i) => {
    const v = (currentYear + i).toString();
    return { label: v, value: v };
  });

  // Sync external changes
  useEffect(() => {
    if (isValidDate(startValue)) {
      setStartDay(startValue);
      setStartTime(format(startValue!, "HH:mm"));
    }
    if (isValidDate(endValue)) {
      setEndDay(endValue);
      setEndTime(format(endValue!, "HH:mm"));
    }
  }, [startValue, endValue]);

  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    setCalendarMonth(new Date(parseInt(selectedYear), parseInt(val), 1));
  };

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    setCalendarMonth(new Date(parseInt(val), parseInt(selectedMonth), 1));
  };

  // Calendar day click
  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    if (activeField === "start") {
      setStartDay(day);
      setActiveField("end");
    } else {
      setEndDay(day);
    }
    setSelectedMonth(day.getMonth().toString());
    setSelectedYear(day.getFullYear().toString());
  };

  const handleApply = () => {
    const sDay = startDay || now;
    const eDay = endDay || sDay;

    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);

    const finalStart = new Date(sDay);
    finalStart.setHours(sH, sM, 0, 0);

    const finalEnd = new Date(eDay);
    finalEnd.setHours(eH, eM, 59, 0);

    onRangeApply(finalStart, finalEnd);
    setIsOpen(false);
  };

  // Display
  const displayString = isValidDate(startValue) && isValidDate(endValue)
    ? `${format(startValue!, "MMM d, yyyy")} – ${format(endValue!, "MMM d, yyyy")}`
    : isValidDate(startValue)
      ? `${format(startValue!, "MMM d, yyyy")} – ...`
      : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-border bg-background hover:bg-accent/50 overflow-hidden",
            !startValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate min-w-0">{displayString}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side={popDirection === "up" ? "top" : popDirection === "down" ? "bottom" : popDirection as any}
        sideOffset={8}
        className="w-auto p-0 border-none shadow-2xl rounded-xl bg-transparent z-[1000] nikhil-time-calendar-portal"
      >
        <div
          className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl w-[320px] flex flex-col"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Month/Year Header */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <CustomSelect
                value={selectedMonth}
                onValueChange={handleMonthChange}
                options={monthOptions}
                className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                dropdownClassName="w-40 -ml-2"
              />
            </div>
            <div className="flex-1">
              <CustomSelect
                value={selectedYear}
                onValueChange={handleYearChange}
                options={yearOptions}
                className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                dropdownClassName="w-32"
              />
            </div>
          </div>

          {/* Calendar */}
          <div className="px-3 pb-3">
            <Calendar
              mode="single"
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={activeField === "start" ? startDay : endDay}
              fixedWeeks={true}
              showOutsideDays={true}
              onSelect={handleDaySelect}
              className="bg-transparent p-0 mt-3 flex justify-center"
              classNames={{
                months: "bg-transparent",
                month: "bg-transparent",
                month_caption: "hidden",
                nav: "hidden",
                caption: "hidden",
                table: "w-full border-collapse space-y-1 mx-auto",
              }}
            />
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Start Row */}
          <div className="px-4 pt-3 pb-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start</label>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setActiveField("start")}
                className={cn(
                  "flex-1 h-9 px-3 rounded-md border text-sm text-left transition-colors",
                  activeField === "start"
                    ? "border-foreground bg-accent/50 font-medium"
                    : "border-border bg-background hover:bg-accent/30"
                )}
              >
                {startDay ? format(startDay, "MMM d, yyyy") : "Pick date"}
              </button>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 px-2 rounded-md border border-border bg-background text-sm w-[110px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* End Row */}
          <div className="px-4 pt-2 pb-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End</label>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setActiveField("end")}
                className={cn(
                  "flex-1 h-9 px-3 rounded-md border text-sm text-left transition-colors",
                  activeField === "end"
                    ? "border-foreground bg-accent/50 font-medium"
                    : "border-border bg-background hover:bg-accent/30"
                )}
              >
                {endDay ? format(endDay, "MMM d, yyyy") : "Pick date"}
              </button>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9 px-2 rounded-md border border-border bg-background text-sm w-[110px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Apply */}
          <div className="p-3 bg-muted/20 border-t border-border rounded-b-xl">
            <Button
              type="button"
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium"
              onClick={handleApply}
            >
              Apply ↵
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
