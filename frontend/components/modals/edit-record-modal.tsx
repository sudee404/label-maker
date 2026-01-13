"use client";

import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ShipmentRecord,
  AddressFormData,
  PackageFormData,
} from "@/lib/schemas";
import { AddressModal } from "./address-modal";
import { PackageModal } from "./package-modal";
import { useState } from "react";
import axios from "axios";

interface EditRecordModalProps {
  record: ShipmentRecord;
  onSave: () => void;
  onClose: () => void;
}

export function EditRecordModal({
  record,
  onSave,
  onClose,
}: EditRecordModalProps) {
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  const handleAddressSave =
    (type: "from" | "to") => async (updatedAddress: AddressFormData) => {
      // save address
      await axios
        .patch(`/api/addresses/${record?.id}`, {
          ...updatedAddress,
          type: type,
        })
        .then(() => onSave())
        .catch((err) => console.log(err));
    };

  const handlePackageSave = async (updatedPackage: PackageFormData) => {
    await axios
      .patch(`/api/packages/${record?.id}`, updatedPackage)
      .then(() => onSave())
      .catch((err) => console.log(err));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">
            Edit Shipment Record
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 p-8 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFromModal(true)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Ship From
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowToModal(true)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Ship To
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPackageModal(true)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Package
          </Button>
        </div>

        {showFromModal && (
          <AddressModal
            title="Edit Ship From Address"
            initialData={record.ship_from}
            onSave={handleAddressSave("from")}
            onClose={() => setShowFromModal(false)}
          />
        )}

        {showToModal && (
          <AddressModal
            title="Edit Ship To Address"
            initialData={record.ship_to}
            onSave={handleAddressSave("to")}
            onClose={() => setShowToModal(false)}
          />
        )}

        {showPackageModal && (
          <PackageModal
            initialData={record.package}
            onSave={handlePackageSave}
            onClose={() => setShowPackageModal(false)}
          />
        )}
      </div>
    </div>
  );
}
