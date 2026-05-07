import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 p-6 shadow-2xl shadow-charcoal-950/20">
                {title && (
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title className="text-lg font-black text-charcoal-950 dark:text-zinc-50 tracking-tight">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-charcoal-800/55 dark:text-zinc-400 hover:text-charcoal-950 dark:hover:text-zinc-50 transition-colors duration-200 p-1"
                      aria-label="Cerrar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
