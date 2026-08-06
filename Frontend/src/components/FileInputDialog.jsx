import { useState } from 'react';
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileInputIcon, InfoIcon } from "lucide-react"
import { useRef } from "react"
import useChatStore from '@/Stores/useChatStore';
import { div } from 'three/src/nodes/math/OperatorNode.js';

export function FileInputDialog({ openFileDialog, setOpenFileDialog }) {

    const fileInputRef = useRef(null);
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "video/mp4",
    ];
    const { uploadFile , uploadMultipleFiles } = useChatStore();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const MAX_SIZE = 25 * 1024 * 1024;

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 10) {
            toast.error("Maximum 10 files allowed.");
            return;
        }

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                toast.error(`${file.name} is not supported.`);
                return;
            }

            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} exceeds 25 MB.`);
                return;
            }
        }

        setSelectedFiles(files);
    };
    const handleUpload = async () => {
        await uploadFile(selectedFiles[0]);
        if(selectedFiles.length > 1){
            await uploadMultipleFiles(selectedFiles);
        }
        setOpenFileDialog(false);
        toast.success("File uploaded successfully");
    };
    return (
        <Dialog open={openFileDialog} onOpenChange={setOpenFileDialog} >
            <form>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader className={"justify-center items-center gap-3"} >
                        <DialogTitle className="font-semibold mt-1.5" >Send Files</DialogTitle>
                        <DialogDescription className={"font-extralight text-start"}>
                            *maximum 10 files allowed , size limit : 25MB
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center">
                        <Input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            className={"hidden"}
                            accept="
                                image/jpeg,
                                image/png,
                                image/gif,
                                application/pdf,
                                application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                                video/mp4
                            "
                            onChange={handleFileChange}
                        />

                        <Button className=" border-blue-600 flex justify-center items-center h-10" onClick={() => fileInputRef.current?.click()} type="button" >
                            <FileInputIcon className="mr-2 h-4 w-4" />
                            Choose Files
                        </Button>

                        
                        {selectedFiles.map((file) =>
                            file.type.startsWith("image/") ? (
                                <div className='flex items-center justify-center flex-wrap gap-2'>
                                <img
                                    key={`${file.name}-${file.lastModified}`}
                                    src={URL.createObjectURL(file)}
                                    className="h-24 w-24 rounded object-cover"
                                    />
                                    </div>
                            ) : (
                                <div key={file.name}>{file.name}</div>
                            )
                        )}
                        <div className="mt-4 w-full space-y-2">
                            {selectedFiles.map((file) => (
                                <div
                                    key={file.name}
                                    className="flex justify-between rounded border p-2 text-sm"
                                >
                                    <span>{file.name}</span>
                                    <span>
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0}
                            type="button"
                        >
                            Send
                        </Button>
                    </div>
                    <DialogFooter className={"flex items-center justify-center"}>
                        *limited file types support <Button size="icon"><InfoIcon className="w-5 h-5" /></Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
