using ICSharpCode.SharpZipLib.Zip;
using MessianicChords.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Xml;

namespace MessianicChords.Services
{
    /// <summary>
    /// Converts .docx to plain text. Based on http://www.codeproject.com/Articles/20529/Using-DocxToText-to-Extract-Text-from-DOCX-Files
    /// </summary>
    public class DocxToText
    {
        private const string ContentTypeNamespace =
            @"http://schemas.openxmlformats.org/package/2006/content-types";

        private const string WordprocessingMlNamespace =
            @"http://schemas.openxmlformats.org/wordprocessingml/2006/main";

        private const string DocumentXmlXPath =
            "/t:Types/t:Override[@ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"]";

        private const string BodyXPath = "/w:document/w:body";

        private Stream docxFileStream;
        private string docxFileEntry = "";
        private DocumentTextFetchRecord record;


        public DocxToText(Stream stream, DocumentTextFetchRecord record)
        {
            if (stream == null)
            {
                throw new ArgumentNullException(nameof(stream));
            }

            this.docxFileStream = stream;
            this.record = record;
        }


        /// <summary>
        /// Extracts text from the Docx file.
        /// </summary>
        /// <returns>Extracted text.</returns>
        public string ExtractText()
        {
            // Usually it is "/word/document.xml"

            using (var zipFile = new ZipFile(docxFileStream))
            {
                docxFileEntry = FindDocumentXmlLocation(zipFile);
                record.Log.Add("Found docxFileEntry to be " + docxFileEntry);

                if (string.IsNullOrEmpty(docxFileEntry))
                {
                    record.Log.Add("Couldn't find docx entry. Returning empty string.");
                    return string.Empty;
                }

                return ReadDocumentXml(zipFile);
            }
        }

        /// <summary>
        /// Gets location of the "document.xml" zip entry.
        /// </summary>
        /// <returns>Location of the "document.xml".</returns>
        private string FindDocumentXmlLocation(ZipFile zip)
        {
            foreach (ZipEntry entry in zip)
            {
                // Find "[Content_Types].xml" zip entry

                if (string.Compare(entry.Name, "[Content_Types].xml", true) == 0)
                {
                    Stream contentTypes = zip.GetInputStream(entry);

                    XmlDocument xmlDoc = new XmlDocument();
                    xmlDoc.PreserveWhitespace = true;
                    xmlDoc.Load(contentTypes);
                    contentTypes.Close();

                    //Create an XmlNamespaceManager for resolving namespaces

                    XmlNamespaceManager nsmgr = new XmlNamespaceManager(xmlDoc.NameTable);
                    nsmgr.AddNamespace("t", ContentTypeNamespace);

                    // Find location of "document.xml"

                    XmlNode node = xmlDoc.DocumentElement.SelectSingleNode(DocumentXmlXPath, nsmgr);

                    if (node != null)
                    {
                        string location = ((XmlElement)node).GetAttribute("PartName");
                        return location.TrimStart('/');
                    }
                    break;
                }
            }
                
            return null;
        }

        /// <summary>
        /// Reads "document.xml" zip entry.
        /// </summary>
        /// <returns>Text containing in the document.</returns>
        private string ReadDocumentXml(ZipFile zip)
        {
            StringBuilder sb = new StringBuilder();
            
            foreach (ZipEntry entry in zip)
            {
                if (entry.Name != null && entry.Name.EndsWith(docxFileEntry, StringComparison.InvariantCultureIgnoreCase))
                {
                    using (var documentXml = zip.GetInputStream(entry))
                    {
                        var xmlDoc = new XmlDocument();
                        xmlDoc.PreserveWhitespace = true;
                        xmlDoc.Load(documentXml);
                        documentXml.Close();

                        var nsmgr = new XmlNamespaceManager(xmlDoc.NameTable);
                        nsmgr.AddNamespace("w", WordprocessingMlNamespace);

                        var node = xmlDoc.DocumentElement.SelectSingleNode(BodyXPath, nsmgr);
                        if (node == null)
                        {
                            return string.Empty;
                        }

                        sb.Append(ReadNode(node));

                        break;
                    }
                }

            }
            
            return sb.ToString();
        }

        /// <summary>
        /// Reads content of the node and its nested childs.
        /// </summary>
        /// <param name="node">XmlNode.</param>
        /// <returns>Text containing in the node.</returns>
        private string ReadNode(XmlNode node)
        {
            if (node == null || node.NodeType != XmlNodeType.Element)
                return string.Empty;

            StringBuilder sb = new StringBuilder();
            foreach (XmlNode child in node.ChildNodes)
            {
                if (child.NodeType != XmlNodeType.Element) continue;

                switch (child.LocalName)
                {
                    case "t":                           // Text
                        sb.Append(child.InnerText.TrimEnd());

                        string space = ((XmlElement)child).GetAttribute("xml:space");
                        if (!string.IsNullOrEmpty(space) && space == "preserve")
                            sb.Append(' ');

                        break;

                    case "cr":                          // Carriage return
                    case "br":                          // Page break
                        sb.Append(Environment.NewLine);
                        break;

                    case "tab":                         // Tab
                        sb.Append("\t");
                        break;

                    case "p":                           // Paragraph
                        sb.Append(ReadNode(child));
                        sb.Append(Environment.NewLine);
                        sb.Append(Environment.NewLine);
                        break;

                    default:
                        sb.Append(ReadNode(child));
                        break;
                }
            }
            return sb.ToString();
        }
    }
}