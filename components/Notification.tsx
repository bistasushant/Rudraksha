"use client";
import { Bell } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

const Notification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const handleNotificationClick = () => {
    setIsVisible(!isVisible);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target as Node)
    ) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    // Add event listener for clicks outside the notification
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={handleNotificationClick}
        className="flex items-center justify-center p-2 text-gray-600 rounded-full hover:bg-gray-800/20 transition duration-200"
      >
        <Bell />
      </button>

      {isVisible && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-4">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <ul className="mt-2">
              <li className="py-1 border-b border-gray-200">
                New message from John
              </li>
              <li className="py-1 border-b border-gray-200">
                Your order has been shipped
              </li>
              <li className="py-1">New comment on your post</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;

// THis is V.IMP
//This the code for comment with actual API. we will remove above code and use this code (add API Call)
// "use client";
// import { Bell, Settings } from "lucide-react";
// import React, { useState, useRef, useEffect, useCallback } from "react";
// import { formatDistanceToNow } from 'date-fns';

// // If using Next.js App Router for navigation:
// // import { useRouter } from 'next/navigation';

// // (Keep the NotificationData interface as defined before)
// interface NotificationData {
//   id: string;
//   message: string;
//   link?: string;
//   isRead: boolean;
//   timestamp: string;
//   type?: string; // Optional: for notification type icons
// }

// const Notification = () => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [notifications, setNotifications] = useState<NotificationData[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const notificationRef = useRef<HTMLDivElement | null>(null);
//   // If using Next.js App Router for navigation:
//   // const router = useRouter();

//   // --- Fetch Notifications with Actual API Call ---
//   const fetchNotifications = useCallback(async () => {
//     console.log("Fetching notifications from API...");
//     setIsLoading(true);
//     setError(null);
//     try {
//       // Replace with your actual API endpoint
//       const response = await fetch('/api/notifications'); // GET request by default

//       if (!response.ok) {
//         // Handle HTTP errors (e.g., 4xx, 5xx)
//         throw new Error(`API Error: ${response.status} ${response.statusText}`);
//       }

//       const data: NotificationData[] = await response.json();

//       // Sort newest first (optional, API might do this)
//       setNotifications(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

//     } catch (err) {
//       console.error("Failed to fetch notifications:", err);
//       // Handle fetch errors (network issues, JSON parsing errors)
//       setError(err instanceof Error ? err.message : "Could not load notifications.");
//       setNotifications([]); // Clear notifications on error
//     } finally {
//       setIsLoading(false);
//     }
//   }, []); // No dependencies needed if API endpoint is static

//   // Fetch notifications when the component mounts
//   useEffect(() => {
//     fetchNotifications();
//   }, [fetchNotifications]);

//   // --- Handle Clicking on a Notification Item with API Call ---
//   const handleNotificationItemClick = async (notificationId: string) => { // Make async
//     const clickedNotification = notifications.find(n => n.id === notificationId);
//     if (!clickedNotification || clickedNotification.isRead) {
//       // Optional: Don't do anything if already read, or just navigate
//       if (clickedNotification?.link) {
//         console.log(`Navigating to: ${clickedNotification.link}`);
//         // router.push(clickedNotification.link); // Example using Next.js router
//       }
//       setIsVisible(false); // Close dropdown even if already read
//       return;
//     }

//     console.log(`Notification ${notificationId} clicked. Marking as read.`);

//     // 1. Optimistic UI Update: Mark as read locally immediately
//     const originalNotifications = notifications; // Store original state for potential rollback
//     setNotifications(prevNotifications =>
//       prevNotifications.map(n =>
//         n.id === notificationId ? { ...n, isRead: true } : n
//       )
//     );

//     // 2. Call API to mark as read on the backend
//     try {
//       // Replace with your actual API endpoint structure
//       const response = await fetch(`/api/notifications/${notificationId}/read`, {
//         method: 'POST',
//         headers: {
//           // Add authentication headers if required (e.g., Authorization: 'Bearer YOUR_TOKEN')
//           'Content-Type': 'application/json', // Specify content type even if body is empty
//         },
//         // body: JSON.stringify({}) // Send empty body or specific data if API requires
//       });

//       if (!response.ok) {
//         // Handle API error for the POST request
//         throw new Error(`API Error: ${response.status} ${response.statusText}`);
//       }

//       console.log(`Notification ${notificationId} successfully marked as read on backend.`);
//       // Optional: Re-fetch notifications to ensure consistency, though often not needed after a successful POST
//       // fetchNotifications();

//     } catch (err) {
//       console.error("Failed to mark notification as read on backend:", err);
//       // Optional: Rollback optimistic update if API call fails
//       setError("Failed to update notification status."); // Show an error message
//       setNotifications(originalNotifications); // Revert to original state
//     } finally {
//       // 3. Perform navigation or other client-side action *after* API attempt (or parallel)
//       if (clickedNotification.link) {
//         console.log(`Navigating to: ${clickedNotification.link}`);
//         // Use Next.js router or standard navigation:
//         // router.push(clickedNotification.link);
//         // Or: window.location.href = clickedNotification.link;
//       }

//       // 4. Close the dropdown
//       setIsVisible(false);
//     }
//   };

//   // --- Mark All as Read Functionality ---
//   const handleMarkAllAsRead = async () => {
//     if (notifications.every(n => n.isRead)) {
//       setIsVisible(false);
//       return;
//     }

//     console.log("Marking all notifications as read...");
//     setIsLoading(true); // Optionally show loading state
//     setError(null);
//     try {
//       const response = await fetch('/api/notifications/read-all', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`API Error: ${response.status} ${response.statusText}`);
//       }

//       console.log("Successfully marked all notifications as read on backend.");
//       // Update local state
//       setNotifications(prevNotifications => prevNotifications.map(n => ({ ...n, isRead: true })));
//     } catch (err) {
//       console.error("Failed to mark all notifications as read:", err);
//       setError("Failed to update notification statuses.");
//       // Optionally, consider a more specific error message or rollback
//     } finally {
//       setIsLoading(false); // Hide loading state
//       setIsVisible(false); // Close the dropdown
//     }
//   };

//   // --- Grouping by Date ---
//   const groupedNotifications = notifications.reduce((acc, notification) => {
//     const date = new Date(notification.timestamp).toLocaleDateString();
//     if (!acc[date]) {
//       acc[date] = [];
//     }
//     acc[date].push(notification);
//     return acc;
//   }, {} as { [key: string]: NotificationData[] });

//   const sortedDates = Object.keys(groupedNotifications).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

//   // --- Handle Visibility Toggle ---
//   const handleToggleVisibility = () => {
//     setIsVisible(!isVisible);
//   };

//   // --- Handle Click Outside ---
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
//         setIsVisible(false);
//       }
//     };

//     if (isVisible) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isVisible]);

//   // --- Calculate Unread Count ---
//   const unreadCount = notifications.filter(n => !n.isRead).length;

//   // --- Render Icon based on Type (Example) ---
//   const renderNotificationIcon = (type?: string) => {
//     // You would define your icon mapping here
//     switch (type) {
//       case 'new_message':
//         return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2 text-blue-500"><path fillRule="evenodd" d="M6 3.75A2.25 2.25 0 003.75 6v10.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6zm3.75 15h5.25a.75.75 0 000-1.5H9.75a.75.75 0 000 1.5zm-3-3.75h11.25a.75.75 0 000-1.5H6.75a.75.75 0 000 1.5zm-3-3.75h11.25a.75.75 0 000-1.5H3.75a.75.75 0 000 1.5z" clipRule="evenodd" /></svg>;
//       case 'new_user':
//         return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2 text-green-500"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3V12a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-1.5 8.25a3 3 0 006 0v3a1.5 1.5 0 00-1.5 1.5h-3a1.5 1.5 0 00-1.5-1.5v-3z" clipRule="evenodd" /></svg>;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="relative" ref={notificationRef}>
//       {/* (Keep the Bell Button with Badge JSX) */}
//       <button
//         onClick={handleToggleVisibility}
//         className="relative flex items-center justify-center p-2 text-gray-600 rounded-full hover:bg-gray-800/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
//         aria-haspopup="true"
//         aria-expanded={isVisible}
//         aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
//       >
//         <Bell />
//         {unreadCount > 0 && (
//           <span
//             className="absolute top-0 right-0 block h-4 w-4 transform translate-x-1/3 -translate-y-1/3 rounded-full bg-red-600 text-white text-xs flex items-center justify-center"
//             aria-hidden="true"
//           >
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {/* (Keep the Dropdown Panel JSX, it will now use the state updated by the API calls) */}
//       {isVisible && (
//         <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
//           {/* Header */}
//           <div className="p-3 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
//             <h3 className="font-semibold text-base">Notifications</h3>
//             <button onClick={handleMarkAllAsRead} className="text-sm text-blue-600 hover:underline focus:outline-none">
//               Mark all as read
//             </button>
//             {/* Link to Notification Settings */}
//             {/* <button onClick={() => router.push('/account/settings/notifications')} className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none">
//               <Settings className="h-4 w-4" />
//             </button> */}
//           </div>
//           {/* Content Area */}
//           <div>
//             {isLoading ? (
//               <div className="p-4 text-center text-gray-500">Loading...</div>
//             ) : error ? (
//               <div className="p-4 text-center text-red-600">{error} <button onClick={fetchNotifications} className="ml-2 text-sm text-blue-600 underline">Retry</button></div> // Added retry button
//             ) : notifications.length === 0 ? (
//               <div className="p-4 text-center text-gray-500">
//                 <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659 6.002 6.002 0 00-4 5.659v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m8-12h.01M9 16h.01" />
//                 </svg>
//                 <p className="mt-1 text-sm text-gray-500">No new notifications.</p>
//               </div>
//             ) : (
//               <ul className="divide-y divide-gray-200">
//                 {sortedDates.map(date => (
//                   <li key={date}>
//                     <div className="bg-gray-50 p-2 text-xs text-gray-500 sticky top-0">
//                       {/* Format date as "Today", "Yesterday", etc. */}
//                       {new Date(date).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' :
//                         new Date(date).toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' :
//                           new Date(date).toLocaleDateString()}
//                     </div>
//                     {groupedNotifications[date].map((notification) => (
//                       <li key={notification.id}>
//                         <button
//                           onClick={() => handleNotificationItemClick(notification.id)}
//                           className={`w-full text-left p-3 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out flex items-center ${
//                             !notification.isRead ? 'bg-blue-50' : ''
//                           }`}
//                           aria-label={`Notification: ${notification.message}. ${notification.isRead ? 'Status: Read.' : 'Status: Unread.'} Click to view.`}
//                         // Disable button slightly if already read to prevent accidental API calls (optional)
//                         // disabled={notification.isRead && !notification.link}
//                         >
//                           {!notification.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>}
//                           {renderNotificationIcon(notification.type)}
//                           <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-normal'} text-gray-800`}>
//                             {notification.message}
//                           </p>
//                           <p className="text-xs text-gray-500 ml-auto">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
//                         </button>
//                       </li>
//                     ))}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//           {/* Footer */}
//           {notifications.length > 0 && (
//             <div className="p-3 border-t border-gray-200 text-center bg-white">
//               {/* View All Notifications Link */}
//               {/* <button onClick={() => router.push('/notifications')} className="text-sm text-blue-600 hover:underline focus:outline-none">
//                 View All Notifications
//               </button> */}
//               {/* Basic "Load More" button example (replace with actual pagination logic) */}
//               {/* {hasMore && (
//                 <button onClick={loadMoreNotifications} className="mt-2 text-sm text-blue-600 hover:underline focus:outline-none">
//                   Load More
//                 </button>
//               )} */}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Notification;
