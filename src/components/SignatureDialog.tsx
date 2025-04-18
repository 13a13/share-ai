
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import SignaturePad from "react-signature-canvas";

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; date: string; signature: string }) => void;
}

const SignatureDialog = ({ open, onClose, onSave }: SignatureDialogProps) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const signaturePadRef = useRef<SignaturePad>(null);

  const handleSave = () => {
    if (!signaturePadRef.current || !name) return;
    
    const signatureData = signaturePadRef.current.toDataURL();
    onSave({
      name,
      date,
      signature: signatureData
    });
    onClose();
  };

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="border rounded-md p-2">
            <SignaturePad
              ref={signaturePadRef}
              canvasProps={{
                className: "w-full h-40 border rounded-md bg-white"
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleSave} disabled={!name}>
              Save Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
