"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import Layout from "@/components/Layout";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Custom day cell for month view to highlight today
function CustomDateCell({ label, date }) {
  const isToday = moment(date).isSame(moment(), 'day');
  return (
    <div
      className="rbc-day-bg"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        padding: "6px 8px 0 0",
        height: "100%",
        width: "100%",
        position: "relative"
      }}
    >
      {isToday ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid #ec4899",
            background: "#fff",
            color: "#ec4899",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {label}
        </span>
      ) : (
        <span style={{ color: "#a1a1aa", fontWeight: 500 }}>{label}</span>
      )}
    </div>
  );
}

// Custom Toolbar with arrows and view buttons
function CustomToolbar({ label, onNavigate, views, view, onView }) {
  return (
    <div className="flex flex-col items-center mb-4 gap-2">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="text-pink-600 hover:bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
          aria-label="Previous"
          type="button"
        >
          ←
        </button>
        <span className="text-lg font-bold text-pink-700 select-none">{label}</span>
        <button
          onClick={() => onNavigate('NEXT')}
          className="text-pink-600 hover:bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
          aria-label="Next"
          type="button"
        >
          → 
        </button>
      </div>
      <div className="flex gap-2 mt-1">
        {views.map(v => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-3 py-1 rounded text-xs font-semibold border ${
              view === v
                ? "bg-pink-600 text-white border-pink-600"
                : "bg-white text-pink-600 border-pink-200 hover:bg-pink-50"
            }`}
            type="button"
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SocialCalendarApp() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    caption: '',
    image: null,
    video: null,
    type: 'Blog Article',
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteDate, setNoteDate] = useState(null);
  const [note, setNote] = useState({ title: '', text: '' });
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [thumbnailOpenId, setThumbnailOpenId] = useState(null);
  const fileInputRef = useRef(null);

  // Load events from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("socialCalendarEvents");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setEvents(
            parsed.map(ev => ({
              ...ev,
              start: ev.start ? new Date(ev.start) : null,
              end: ev.end ? new Date(ev.end) : null,
              image: null,
              video: null,
            }))
          );
        } catch {}
      }
    }
  }, []);

  // Save events to localStorage on change (excluding media)
  useEffect(() => {
    const toStore = events.map(ev => ({
      ...ev,
      image: null,
      video: null,
    }));
    if (typeof window !== "undefined") {
      localStorage.setItem("socialCalendarEvents", JSON.stringify(toStore));
    }
  }, [events]);

  const handleAddEvent = () => {
    setEvents([
      ...events,
      {
        ...newEvent,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end),
        id: Date.now(),
        allDay: false,
      },
    ]);
    setNewEvent({ title: '', start: '', end: '', caption: '', image: null, video: null, type: 'Blog Article' });
  };

  const handleCombinedFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      setNewEvent({ ...newEvent, image: file, video: null });
    } else if (file.type.startsWith('video/')) {
      setNewEvent({ ...newEvent, video: file, image: null });
    }
  };

  const handleSelectEvent = (event) => setSelectedEvent(event);

  const handleSaveEditEvent = () => {
    setEvents(events =>
      events.map(ev =>
        ev.id === editEvent.id
          ? {
              ...ev,
              title: editEvent.title,
              caption: editEvent.caption,
              start: new Date(editEvent.start),
              end: new Date(editEvent.end),
              type: editEvent.type,
            }
          : ev
      )
    );
    setSelectedEvent(null);
    setEditEvent(null);
  };

  const handleEventDrop = ({ event, start, end, allDay }) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === event.id ? { ...ev, start, end, allDay } : ev
      )
    );
  };

  const handleDropFromOutside = ({ start, end, allDay }) => {
    if (draggedEvent) {
      setEvents(events =>
        events
          .filter(ev => ev.id !== draggedEvent.id)
          .concat({
            ...draggedEvent,
            start,
            end,
            allDay,
            id: draggedEvent.id,
          })
      );
      setDraggedEvent(null);
    }
  };

  const dragFromOutsideItem = () => draggedEvent;

  const customEventPropGetter = () => ({
    className: 'bg-white border border-gray-200 shadow-sm overflow-hidden rounded-md p-4 h-full mx-2 my-1',
    style: { padding: 3 },
  });

  const handleSlotSelect = (slotInfo) => {
    if (slotInfo && slotInfo.start && slotInfo.end && slotInfo.action === 'click') {
      setNoteDate(slotInfo.start);
      setNote({ title: '', text: '' });
      setShowNoteDialog(true);
    }
  };

  const handleAddNote = () => {
    setEvents([
      ...events,
      {
        title: note.title || 'Note',
        caption: note.text,
        start: noteDate,
        end: noteDate,
        id: Date.now(),
        type: 'Note',
        image: null,
        video: null,
        isNote: true,
      },
    ]);
    setShowNoteDialog(false);
    setNoteDate(null);
    setNote({ title: '', text: '' });
  };

  const handleOpenComposeForDate = (date) => {
    setNewEvent({
      ...newEvent,
      start: moment(date).format("YYYY-MM-DDTHH:mm"),
      end: moment(date).add(1, "hour").format("YYYY-MM-DDTHH:mm"),
    });
    setShowCreateDialog(true);
    setHoveredDate(null);
  };

  const slotPropGetter = date => ({
    onMouseEnter: () => setHoveredDate(date),
    onMouseLeave: () => { setHoveredDate(null); setHoveredMenu(null); },
    style: { position: "relative" }
  });

  // In DateCellWrapper, add data-date attribute for reliable matching
  const DateCellWrapper = ({ value, children }) => {
    const isHovered = hoveredDate && moment(value).isSame(hoveredDate, 'day');
    // Check if this cell has any events or notes
    const hasEvent = events.some(
      ev =>
        moment(ev.start).isSame(moment(value), 'day') &&
        !ev.isNote
    );
    const hasNote = events.some(
      ev =>
        moment(ev.start).isSame(moment(value), 'day') &&
        ev.isNote
    );
    const isEmpty = !hasEvent && !hasNote;

    return (
      <div
        data-date={moment(value).format('YYYY-MM-DD')}
        onMouseEnter={() => setHoveredDate(value)}
        onMouseLeave={() => { setHoveredDate(null); setHoveredMenu(null); }}
        style={{ position: "relative", height: "100%" }}
      >
        {/* Dotted card visual for "+ new post" only if cell is empty */}
        {isHovered && isEmpty && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ pointerEvents: "auto" }}
          >
            <button
              className="w-[90%] h-[80%] flex items-center justify-center border-2 border-dotted border-pink-400 rounded-xl bg-pink-50/40 transition-all"
              style={{ outline: "none" }}
              onClick={() => handleOpenComposeForDate(value)}
              type="button"
            >
              <span className="text-pink-400 text-lg font-bold flex items-center gap-1">
                <span className="text-xl">＋</span> new post
              </span>
            </button>
          </div>
        )}
        {children}
      </div>
    );
  };

  const CustomEvent = (props) => {
    const { event } = props;
    const isThumbnailOpen = thumbnailOpenId === event.id;
    return (
      <div
        data-event-id={event.id}
        className={`h-full rounded-xl border ${event.isNote ? 'border-yellow-400 bg-yellow-50' : 'border-pink-200 bg-pink-50'} shadow-sm overflow-hidden flex flex-col relative`}
        title={event.title}
      >
        {/* Red delete button in upper right */}
        <button
          onClick={e => {
            e.stopPropagation();
            setEvents(events => events.filter(ev => ev.id !== event.id));
          }}
          className="absolute top-1 right-1 text-red-500 text-xs font-bold px-2 py-0.5 hover:bg-red-100 z-10"
          title="Delete"
        >
          ✕
        </button>
        {/* Down arrow toggle button always at bottom right */}
        {!event.isNote && (event.image || event.video) && (
          <button
            onClick={e => {
              e.stopPropagation();
              setThumbnailOpenId(isThumbnailOpen ? null : event.id);
            }}
            className="absolute bottom-1 right-1 text-pink-500 text-xs font-bold px-2 py-0.5 hover:bg-pink-100 z-10 flex items-center"
            title={isThumbnailOpen ? "Hide thumbnail" : "Show thumbnail"}
          >
            <span className={`transition-transform ${isThumbnailOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
        )}
        {event.isNote ? (
          <>
            <div className="px-2 pb-1 text-sm font-bold text-pink-600 truncate flex items-center gap-1 pt-3">
              <span>📝</span>
              <span>{event.title}</span>
            </div>
            <div className="px-2 pt-1 pb-2 text-xs text-pink-500">{event.caption}</div>
          </>
        ) : (
          <>
            <div className="px-2 pt-3 pb-1 text-sm font-bold text-pink-600 truncate">{event.title}</div>
            <div className="px-2 pb-1 text-xs font-medium text-pink-500 flex items-center gap-1">
              <span>{event.type === 'Reel' ? '🎥' : event.type === 'Story' ? '📸' : '📄'}</span>
              <span>{event.type}</span>
            </div>
            {isThumbnailOpen && event.image && (
              <div className="flex-shrink-0 w-full h-40 overflow-hidden rounded-b transition-all duration-200">
                <img
                  src={URL.createObjectURL(event.image)}
                  alt="Thumbnail"
                  className="w-full h-full object-cover rounded-b"
                />
              </div>
            )}
            {isThumbnailOpen && event.video && (
              <div className="relative flex-shrink-0 w-full h-40 overflow-hidden rounded-b transition-all duration-200">
                <video className="w-full h-full object-cover opacity-70 rounded-b" muted>
                  <source src={URL.createObjectURL(event.video)} />
                </video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 text-white p-1 rounded-full text-xs">▶</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    const calendar = document.querySelector('.rbc-month-view');
    if (!calendar) return;
    const rows = Array.from(calendar.querySelectorAll('.rbc-month-row'));

    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('.rbc-day-bg'));
      let maxEvents = 0;
      let thumbnailCell = null;

      // Find max events in any cell and the cell with the open thumbnail
      cells.forEach((cell) => {
        const eventsInCell = cell.querySelectorAll('.rbc-event');
        if (eventsInCell.length > maxEvents) maxEvents = eventsInCell.length;
        if (
          thumbnailOpenId &&
          Array.from(eventsInCell).some(ev =>
            ev.getAttribute('data-event-id') === String(thumbnailOpenId)
          )
        ) {
          thumbnailCell = cell;
        }
      });

      // Height per event card
      const eventCardHeight = 250;
      const baseHeight = 40;
      // If thumbnail is open in this row, set minHeight for thumbnail (e.g. 300px)
      const expandForThumbnail = thumbnailCell ? 300 : 0;
      // Row height is max of (enough for all events, enough for thumbnail)
      const minHeight = Math.max(baseHeight + maxEvents * eventCardHeight, expandForThumbnail);
      row.style.minHeight = `${minHeight}px`;
      row.style.transition = 'min-height 0.35s cubic-bezier(0.4,0,0.2,1)';
    });
  }, [events, thumbnailOpenId]);

  useEffect(() => {
    // Wait for DOM to update before measuring
    setTimeout(() => {
      const calendar = document.querySelector('.rbc-month-view');
      if (!calendar) return;
      const rows = Array.from(calendar.querySelectorAll('.rbc-month-row'));

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('.rbc-day-bg'));
        let maxCellHeight = 0;
        let thumbnailCell = null;

        cells.forEach((cell) => {
          // Find the cell with the open thumbnail
          const eventsInCell = cell.querySelectorAll('.rbc-event');
          if (
            thumbnailOpenId &&
            Array.from(eventsInCell).some(ev =>
              ev.getAttribute('data-event-id') === String(thumbnailOpenId)
            )
          ) {
            thumbnailCell = cell;
          }
          // Measure the actual cell height (including expanded thumbnails)
          const cellRect = cell.getBoundingClientRect();
          if (cellRect.height > maxCellHeight) maxCellHeight = cellRect.height;
        });

        // If thumbnail is open in this row, ensure enough height for the thumbnail (e.g. 300px)
        const expandForThumbnail = thumbnailCell ? 300 : 0;
        // Row height is max of (tallest cell, enough for thumbnail)
        const minHeight = Math.max(maxCellHeight, expandForThumbnail, 120); // 120px minimum for 1 card
        row.style.minHeight = `${minHeight}px`;
        row.style.transition = 'min-height 0.35s cubic-bezier(0.4,0,0.2,1)';
      });
    }, 0); // Run after DOM update
  }, [events, thumbnailOpenId]);

  return (
    <Layout>
      <style>
        {`
          .rbc-event {
            margin-top: 18px !important;
          }
          .rbc-month-row .rbc-day-bg {
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }
          .rbc-day-slot {
            display: flex;
            flex-direction: column;
          }
          .rbc-event {
            width: 100% !important;
          }
          /* Hide the default show more link */
          .rbc-show-more {
            display: none !important;
          }
        `}
      </style>
      <div className="w-full">
        <div className="p-4">
          
          {/* Header sits above everything */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-pink-600">📅 Em & Me Social Calendar</h1>
          </div>
          <div className="flex">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow w-full">
              <div className="lg:col-span-2">
                <DnDCalendar
                  resizable
                  onEventResize={({ event, start, end }) => {
                    const nextEvents = events.map((existingEvent) =>
                      existingEvent.id === event.id ? { ...existingEvent, start, end } : existingEvent
                    );
                    setEvents(nextEvents);
                  }}
                  onEventDrop={handleEventDrop}
                  onDropFromOutside={handleDropFromOutside}
                  dragFromOutsideItem={dragFromOutsideItem}
                  draggableAccessor={() => true}
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 800, background: "#fff", borderRadius: "1rem", border: "1px solid #fbcfe8" }}
                  selectable
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSlotSelect}
                  components={{
                    toolbar: CustomToolbar,
                    event: CustomEvent,
                    dateCellWrapper: DateCellWrapper,
                    month: {
                      dateHeader: ({ label, date }) => <CustomDateCell label={label} date={date} />,
                    },
                  }}
                  eventPropGetter={customEventPropGetter}
                  slotPropGetter={slotPropGetter}
                  views={['month', 'week', 'day', 'agenda']}
                />
              </div>
              <div>
                {/* Compose button in sidebar */}
                <div className="flex flex-col items-end mb-2">
                  <Button
                    style={{ backgroundColor: "#ec4899", color: "white" }}
                    className="mb-2 w-full hover:bg-pink-50"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <span className="mr-2">✏️</span> Compose
                  </Button>
                </div>
                {/* Sidebar for saved posts, exclude notes */}
                <Card className="mb-4 border-pink-200 bg-pink-50 rounded-xl shadow-md">
                  <CardContent>
                    <h2 className="text-md font-semibold mb-2 text-pink-600">💾 Saved</h2>
                    <div className="space-y-2">
                      {events.filter(event => !event.isNote).map((event) => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedEvent(event);
                          }}
                          onDragEnd={() => setDraggedEvent(null)}
                          className="bg-white border border-pink-200 rounded-xl shadow-sm p-2 cursor-move hover:shadow-md relative"
                        >
                          <button
                            onClick={() => setEvents(events.filter(ev => ev.id !== event.id))}
                            className="absolute top-1 right-1 bg-white text-pink-500 text-xs font-bold px-2 py-0.5 rounded shadow hover:bg-pink-50 z-10"
                            title="Delete"
                          >
                            ✕
                          </button>
                          <div className="text-sm font-bold text-pink-600 truncate">{event.title}</div>
                          <div className="text-xs text-gray-500 truncate">{event.caption}</div>
                          {event.image && (
                            <img
                              src={URL.createObjectURL(event.image)}
                              alt="preview"
                              className="w-full h-20 object-cover rounded-b"
                            />
                          )}
                          {event.video && (
                            <div className="w-full h-20 bg-pink-50 text-pink-500 flex items-center justify-center rounded-b">
                              <span className="text-lg">🎥</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Create Post Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="bg-white border-pink-200 rounded-xl">
              <DialogTitle className="text-pink-600">Create Post</DialogTitle>
              <Input
                placeholder="Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="mb-2 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
              />
              {/* Eyebrow label and side-by-side date pickers */}
              <div className="text-xs text-pink-500 mb-1 font-semibold tracking-wide uppercase">Start & End</div>
              <div className="flex gap-2 mb-2">
                <Input
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  className="flex-1 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Start"
                />
                <Input
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  className="flex-1 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="End"
                />
              </div>
              {/* Eyebrow for post type dropdown */}
              <div className="text-xs text-pink-500 mb-1 font-semibold tracking-wide uppercase">Post type</div>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="mb-2 w-full border-pink-200 rounded-md text-sm px-3 py-2 text-pink-600 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="Blog Article">Blog Article</option>
                <option value="Reel">Reel</option>
                <option value="Story">Story</option>
              </select>
              <Textarea
                placeholder="Caption"
                value={newEvent.caption}
                onChange={(e) => setNewEvent({ ...newEvent, caption: e.target.value })}
                className="mb-2 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
              />
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                      setNewEvent({ ...newEvent, image: file, video: null });
                    } else if (file.type.startsWith('video/')) {
                      setNewEvent({ ...newEvent, video: file, image: null });
                    }
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                className="mb-2 flex items-center justify-center border-2 border-dashed border-pink-200 rounded-md h-24 cursor-pointer transition-all hover:border-pink-500 hover:bg-pink-50"
              >
                <span className="text-sm text-pink-500">
                  📎 Upload Media
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleCombinedFileChange}
                />
              </div>
              {(newEvent.image || newEvent.video) && (
                <div className="relative mb-2">
                  {newEvent.image && (
                    <img
                      src={URL.createObjectURL(newEvent.image)}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-b border-pink-200"
                    />
                  )}
                  {newEvent.video && (
                    <video
                      className="w-full h-32 object-cover rounded-b border-pink-200"
                      controls
                      src={URL.createObjectURL(newEvent.video)}
                    />
                  )}
                  <button
                    onClick={() => setNewEvent({ ...newEvent, image: null, video: null })}
                    className="absolute top-1 right-1 bg-white text-pink-500 text-xs font-bold px-2 py-0.5 rounded shadow hover:bg-pink-50"
                  >
                    ✕
                  </button>
                </div>
              )}
              <Button
                className="bg-pink-600 hover:bg-pink-500 text-white rounded shadow-md"
                onClick={() => { handleAddEvent(); setShowCreateDialog(false); }}
              >
                Add to Calendar
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!selectedEvent}
            onOpenChange={() => {
              setSelectedEvent(null);
              setEditEvent(null);
            }}
          >
            <DialogContent className="bg-white border-pink-200 rounded-xl">
              {selectedEvent && (
                <>
                  <div className="text-xs text-pink-500 mb-1 font-semibold tracking-wide uppercase">Post Title</div>
                  <DialogTitle className="text-pink-600">
                    <Input
                      className="mb-2 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
                      value={editEvent?.title ?? selectedEvent.title}
                      onChange={e =>
                        setEditEvent({
                          ...(editEvent || { ...selectedEvent }),
                          title: e.target.value,
                        })
                      }
                    />
                  </DialogTitle>
                  {/* Editable post type dropdown */}
                  <div className="text-xs text-pink-500 mb-1 font-semibold tracking-wide uppercase">Post type</div>
                  <select
                    value={editEvent?.type ?? selectedEvent.type}
                    onChange={e =>
                      setEditEvent({
                        ...(editEvent || { ...selectedEvent }),
                        type: e.target.value,
                      })
                    }
                    className="mb-2 w-full border-pink-200 rounded-md text-sm px-3 py-2 text-pink-600 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="Blog Article">Blog Article</option>
                    <option value="Reel">Reel</option>
                    <option value="Story">Story</option>
                  </select>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-xs text-pink-500 mb-1">Start</label>
                      <Input
                        type="datetime-local"
                        value={
                          editEvent?.start
                            ? moment(editEvent.start).format("YYYY-MM-DDTHH:mm")
                            : moment(selectedEvent.start).format("YYYY-MM-DDTHH:mm")
                        }
                        onChange={e =>
                          setEditEvent({
                            ...(editEvent || { ...selectedEvent }),
                            start: e.target.value,
                          })
                        }
                        className="border-pink-200 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-pink-500 mb-1">End</label>
                      <Input
                        type="datetime-local"
                        value={
                          editEvent?.end
                            ? moment(editEvent.end).format("YYYY-MM-DDTHH:mm")
                            : moment(selectedEvent.end).format("YYYY-MM-DDTHH:mm")
                        }
                        onChange={e =>
                          setEditEvent({
                            ...(editEvent || { ...selectedEvent }),
                            end: e.target.value,
                          })
                        }
                        className="border-pink-200 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-pink-500 mb-1 font-semibold tracking-wide uppercase">Current post time</div>
                  <div className="mb-2 text-xs text-pink-500 font-mono">
                    {moment(editEvent?.start ?? selectedEvent.start).format("MMM D, YYYY HH:mm")}
                    {" - "}
                    {moment(editEvent?.end ?? selectedEvent.end).format("MMM D, YYYY HH:mm")}
                  </div>
                  {selectedEvent?.image && (
                    <img
                      src={URL.createObjectURL(selectedEvent.image)}
                      alt="Event"
                      className="my-2 rounded-b border-pink-200"
                    />
                  )}
                  {selectedEvent?.video && (
                    <video controls className="my-2 rounded-b border-pink-200">
                      <source src={URL.createObjectURL(selectedEvent.video)} />
                    </video>
                  )}
                  <div className="text-xs text-pink-500 mb-1 font-semibold tracking-wide uppercase">Caption Copy</div>
                  <Textarea
                    className="mb-2 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
                    value={editEvent?.caption ?? selectedEvent.caption}
                    onChange={e =>
                      setEditEvent({
                        ...(editEvent || { ...selectedEvent }),
                        caption: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      className="bg-pink-600 hover:bg-pink-500 text-white rounded shadow-md"
                      onClick={handleSaveEditEvent}
                    >
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => { setSelectedEvent(null); setEditEvent(null); }}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Note Dialog */}
          <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
            <DialogContent className="bg-white border-pink-200 rounded-xl">
              <DialogTitle className="text-pink-600">Add Note</DialogTitle>
              <Input
                placeholder="Note Title"
                value={note.title}
                onChange={e => setNote({ ...note, title: e.target.value })}
                className="mb-2 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
              />
              <Textarea
                placeholder="Note text"
                value={note.text}
                onChange={e => setNote({ ...note, text: e.target.value })}
                className="mb-2 border-pink-200 focus:ring-pink-500 focus:border-pink-500"
              />
              <Button
                className="bg-pink-600 hover:bg-pink-500 text-white rounded shadow-md"
                onClick={handleAddNote}
              >
                Save Note
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}