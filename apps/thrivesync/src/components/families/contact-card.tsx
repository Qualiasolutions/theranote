'use client'

import type { FamilyContact } from '@repo/database'
import { Phone, Mail, User, Star, AlertTriangle, Car } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactCardProps {
  contact: FamilyContact
  compact?: boolean
}

export function ContactCard({ contact, compact = false }: ContactCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4 hover:shadow-md transition-shadow',
        contact.is_primary && 'border-purple-200 bg-purple-50/50'
      )}
    >
      {/* Header with name and badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center',
              contact.is_primary ? 'bg-purple-100' : 'bg-gray-100'
            )}
          >
            <User
              className={cn(
                'h-5 w-5',
                contact.is_primary ? 'text-purple-600' : 'text-gray-500'
              )}
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{contact.name}</h4>
            <p className="text-sm text-gray-500 capitalize">{contact.relationship}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {contact.is_primary && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <Star className="h-3 w-3" />
              Primary
            </span>
          )}
          {contact.is_emergency_contact && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Emergency
            </span>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-2">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors truncate"
          >
            <Mail className="h-4 w-4 flex-shrink-0" />
            {contact.email}
          </a>
        )}
      </div>

      {/* Additional info - only show if not compact */}
      {!compact && (
        <>
          {/* Can Pickup Badge */}
          {contact.can_pickup && (
            <div className="mt-3 pt-3 border-t">
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <Car className="h-3 w-3" />
                Authorized for pickup
              </span>
            </div>
          )}

          {/* Preferred Contact Method */}
          {contact.preferred_contact_method && (
            <div className="mt-2">
              <span className="text-xs text-gray-400">
                Prefers: {contact.preferred_contact_method}
              </span>
            </div>
          )}

          {/* Preferred Language */}
          {contact.preferred_language && contact.preferred_language !== 'English' && (
            <div className="mt-1">
              <span className="text-xs text-gray-400">
                Language: {contact.preferred_language}
              </span>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 line-clamp-2">{contact.notes}</p>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
      </div>
    </div>
  )
}
