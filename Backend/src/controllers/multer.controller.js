export const uploadOneFile = (req, res) => {
    console.log("Controller reached");
    console.log(req.file);

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }

    return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file: req.file
    });

};

export const uploadMultipleFiles = (req, res) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No files uploaded"
        });
    }

    return res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        files: req.files
    });

};