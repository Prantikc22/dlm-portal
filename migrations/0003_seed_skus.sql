-- Seed SKUs data with all manufacturing processes
INSERT INTO skus (code, industry, process_name, description, default_moq, default_lead_time_days, parameters_schema) VALUES

-- Mechanical Manufacturing
('cnc_machining', 'Mechanical Manufacturing', 'CNC Machining', 'CNC Turning, Milling, and 5-axis machining services', 10, 14, '{
  "required": ["material", "quantity", "tolerance"],
  "optional": ["surface_finish", "heat_treatment", "secondary_operations"],
  "materials": ["Aluminum", "Steel", "Stainless Steel", "Brass", "Copper", "Titanium", "Plastic"],
  "tolerances": ["±0.1mm", "±0.2mm", "±0.5mm", "±1.0mm"],
  "surface_finishes": ["As machined", "Anodized", "Powder coated", "Plated"]
}'),

('sheet_metal', 'Mechanical Manufacturing', 'Sheet Metal Fabrication', 'Laser cutting, punching, bending, and welding services', 5, 10, '{
  "required": ["material", "thickness", "quantity"],
  "optional": ["surface_finish", "bending_operations", "welding_type"],
  "materials": ["Mild Steel", "Stainless Steel", "Aluminum", "Galvanized Steel"],
  "thickness_range": "0.5mm - 25mm",
  "processes": ["Laser cutting", "Punching", "Bending", "Welding"]
}'),

('injection_molding', 'Mechanical Manufacturing', 'Injection Molding', 'Plastic injection molding with soft and hard tooling', 100, 21, '{
  "required": ["material", "quantity", "part_complexity"],
  "optional": ["tooling_type", "surface_finish", "insert_molding"],
  "materials": ["ABS", "PP", "PE", "PC", "PA", "POM", "TPU"],
  "tooling_types": ["Soft tooling", "Hard tooling", "Aluminum tooling"],
  "moq_range": "100 - 100000"
}'),

('die_casting', 'Mechanical Manufacturing', 'Die Casting', 'Aluminum, Zinc, and Magnesium die casting', 50, 18, '{
  "required": ["material", "quantity", "part_weight"],
  "optional": ["surface_finish", "machining_required", "heat_treatment"],
  "materials": ["Aluminum", "Zinc", "Magnesium"],
  "weight_range": "10g - 5kg",
  "tolerances": ["±0.1mm", "±0.2mm", "±0.3mm"]
}'),

('forging', 'Mechanical Manufacturing', 'Forging', 'Open die, closed die, and ring rolling forging', 25, 20, '{
  "required": ["material", "quantity", "forging_type"],
  "optional": ["heat_treatment", "machining_allowance", "grain_flow"],
  "materials": ["Carbon Steel", "Alloy Steel", "Stainless Steel", "Aluminum", "Titanium"],
  "forging_types": ["Open die", "Closed die", "Ring rolling"],
  "weight_range": "0.1kg - 500kg"
}'),

('extrusion', 'Mechanical Manufacturing', 'Extrusion', 'Aluminum and plastic profile extrusion', 100, 15, '{
  "required": ["material", "profile_type", "quantity"],
  "optional": ["surface_finish", "secondary_operations", "cutting_length"],
  "materials": ["Aluminum", "PVC", "ABS", "PC", "HDPE"],
  "profile_types": ["Standard profiles", "Custom profiles"],
  "length_range": "0.5m - 12m"
}'),

('3d_printing', 'Mechanical Manufacturing', '3D Printing', 'FDM, SLA, SLS, and DMLS 3D printing services', 1, 5, '{
  "required": ["material", "printing_technology", "quantity"],
  "optional": ["surface_finish", "support_removal", "post_processing"],
  "technologies": ["FDM", "SLA", "SLS", "DMLS"],
  "materials": ["PLA", "ABS", "PETG", "Resin", "Nylon", "Metal powders"],
  "max_dimensions": "300x300x300mm"
}'),

('tooling_development', 'Mechanical Manufacturing', 'Tooling Development', 'Molds, dies, jigs, and fixtures development', 1, 30, '{
  "required": ["tooling_type", "application", "material"],
  "optional": ["expected_runs", "tolerance_requirements", "cooling_system"],
  "tooling_types": ["Injection molds", "Die casting dies", "Jigs", "Fixtures"],
  "materials": ["Tool steel", "Aluminum", "Stainless steel"],
  "complexity": ["Simple", "Medium", "Complex"]
}'),

('assembly_kitting', 'Mechanical Manufacturing', 'Assembly & Kitting', 'Product assembly and kitting services', 10, 7, '{
  "required": ["assembly_type", "quantity", "components_count"],
  "optional": ["packaging_requirements", "testing_required", "documentation"],
  "assembly_types": ["Manual assembly", "Automated assembly", "Kitting only"],
  "complexity": ["Simple", "Medium", "Complex"],
  "components_range": "2 - 100 components"
}'),

-- Electronics & Electrical
('pcb_prototyping', 'Electronics & Electrical', 'PCB Prototyping', 'Fast-turn PCB prototyping services', 5, 3, '{
  "required": ["layers", "dimensions", "quantity"],
  "optional": ["material", "surface_finish", "via_type"],
  "layers": ["1", "2", "4", "6", "8", "10+"],
  "materials": ["FR4", "Rogers", "Aluminum", "Flexible"],
  "surface_finishes": ["HASL", "OSP", "ENIG", "Immersion Silver"]
}'),

('pcb_assembly', 'Electronics & Electrical', 'PCB Assembly', 'SMT and through-hole PCB assembly', 10, 7, '{
  "required": ["pcb_type", "components_count", "quantity"],
  "optional": ["testing_requirements", "conformal_coating", "programming"],
  "assembly_types": ["SMT only", "Through-hole only", "Mixed technology"],
  "components_range": "10 - 1000 components",
  "testing": ["AOI", "ICT", "Functional test", "Burn-in"]
}'),

('cable_harness', 'Electronics & Electrical', 'Cable Harness Assembly', 'Custom cable harness and wire assembly', 25, 10, '{
  "required": ["cable_type", "length", "connectors"],
  "optional": ["shielding", "jacketing", "labeling"],
  "cable_types": ["Power cables", "Data cables", "Coaxial", "Ribbon"],
  "length_range": "0.1m - 50m",
  "connectors": ["Standard", "Custom", "Automotive", "Industrial"]
}'),

('box_build', 'Electronics & Electrical', 'Box Build Assembly', 'Electronic enclosure and system assembly', 5, 14, '{
  "required": ["enclosure_type", "complexity", "quantity"],
  "optional": ["testing_requirements", "labeling", "documentation"],
  "enclosure_types": ["Plastic", "Metal", "Custom"],
  "complexity": ["Simple", "Medium", "Complex"],
  "testing": ["Functional", "Environmental", "Safety"]
}'),

('battery_pack', 'Electronics & Electrical', 'Battery Pack Assembly', 'Custom battery pack assembly and testing', 10, 12, '{
  "required": ["battery_type", "voltage", "capacity"],
  "optional": ["bms_required", "enclosure_type", "certification"],
  "battery_types": ["Li-ion", "LiFePO4", "NiMH", "Lead acid"],
  "voltage_range": "3.7V - 400V",
  "certifications": ["UN38.3", "IEC62133", "UL2054"]
}'),

('electronic_testing', 'Electronics & Electrical', 'Electronic Testing & QA', 'ICT, AOI, functional, and burn-in testing', 1, 5, '{
  "required": ["testing_type", "product_type", "quantity"],
  "optional": ["test_duration", "environmental_conditions", "certification"],
  "testing_types": ["ICT", "AOI", "Functional", "Burn-in", "Environmental"],
  "standards": ["IPC", "IEC", "MIL-STD", "ISO"],
  "certifications": ["CE", "FCC", "RoHS", "REACH"]
}'),

-- Packaging & Printing
('corrugated_boxes', 'Packaging & Printing', 'Corrugated Boxes', 'Custom corrugated box manufacturing', 100, 10, '{
  "required": ["box_style", "dimensions", "quantity"],
  "optional": ["printing", "coating", "die_cutting"],
  "box_styles": ["RSC", "HSC", "FOL", "5PF", "Custom"],
  "flute_types": ["3mm", "5mm", "7mm", "Double wall"],
  "printing": ["Flexo", "Offset", "Digital"]
}'),

('carton_packaging', 'Packaging & Printing', 'Carton Packaging', 'Printed carton and folding box manufacturing', 500, 12, '{
  "required": ["carton_type", "material", "printing_colors"],
  "optional": ["surface_finish", "die_cutting", "window_patching"],
  "carton_types": ["Straight tuck", "Reverse tuck", "Auto-lock", "Custom"],
  "materials": ["SBS", "FBB", "Kraft", "Recycled"],
  "finishes": ["Matte", "Gloss", "UV coating", "Lamination"]
}'),

('labels_stickers', 'Packaging & Printing', 'Labels & Stickers', 'Custom label and sticker printing', 1000, 7, '{
  "required": ["label_type", "material", "printing_method"],
  "optional": ["adhesive_type", "die_cutting", "finishing"],
  "label_types": ["Roll labels", "Sheet labels", "Stickers", "Decals"],
  "materials": ["Paper", "Vinyl", "Polyester", "Clear film"],
  "printing": ["Digital", "Flexo", "Screen", "Offset"]
}'),

('flexible_packaging', 'Packaging & Printing', 'Flexible Packaging', 'Pouches, bags, and laminate manufacturing', 1000, 14, '{
  "required": ["package_type", "material_structure", "size"],
  "optional": ["barrier_properties", "closure_type", "printing"],
  "package_types": ["Stand-up pouches", "Flat pouches", "Rollstock", "Bags"],
  "materials": ["PE", "PP", "PET", "Aluminum", "Paper"],
  "barriers": ["Moisture", "Oxygen", "Light", "Aroma"]
}'),

('rigid_packaging', 'Packaging & Printing', 'Rigid Packaging', 'Tins, rigid boxes, and containers', 200, 15, '{
  "required": ["container_type", "material", "capacity"],
  "optional": ["printing", "coating", "closure_type"],
  "container_types": ["Tins", "Rigid boxes", "Bottles", "Jars"],
  "materials": ["Tinplate", "Aluminum", "Plastic", "Glass"],
  "capacity_range": "50ml - 5000ml"
}'),

('foam_protective', 'Packaging & Printing', 'Foam & Protective Packaging', 'Protective foam inserts and packaging', 50, 8, '{
  "required": ["foam_type", "density", "application"],
  "optional": ["die_cutting", "lamination", "conductive_properties"],
  "foam_types": ["PU foam", "EPE foam", "EPS foam", "EVA foam"],
  "density_range": "15kg/m3 - 100kg/m3",
  "properties": ["Anti-static", "Conductive", "Fire retardant"]
}'),

('biodegradable_packaging', 'Packaging & Printing', 'Biodegradable Packaging', 'Eco-friendly and sustainable packaging', 500, 12, '{
  "required": ["package_type", "material", "certification"],
  "optional": ["barrier_properties", "printing", "composting_time"],
  "materials": ["PLA", "Starch-based", "Bagasse", "Paper"],
  "certifications": ["Compostable", "Biodegradable", "Food contact safe"],
  "applications": ["Food packaging", "Retail", "E-commerce"]
}'),

-- Textile & Leather
('cut_and_sew', 'Textile & Leather', 'Cut & Sew Jobwork', 'Garment and uniform manufacturing', 50, 15, '{
  "required": ["garment_type", "fabric_type", "sizes"],
  "optional": ["printing", "embroidery", "special_features"],
  "garment_types": ["T-shirts", "Shirts", "Pants", "Uniforms", "Workwear"],
  "fabrics": ["Cotton", "Polyester", "Blends", "Functional fabrics"],
  "sizes": ["XS-XXL", "Custom sizing"]
}'),

('embroidery_printing', 'Textile & Leather', 'Embroidery & Printing', 'Screen printing and embroidery services', 25, 7, '{
  "required": ["decoration_type", "design_complexity", "quantity"],
  "optional": ["colors", "placement", "special_effects"],
  "decoration_types": ["Screen printing", "Digital printing", "Embroidery", "Heat transfer"],
  "complexity": ["Simple", "Medium", "Complex", "Multi-color"],
  "placements": ["Front", "Back", "Sleeve", "Multiple locations"]
}'),

('knitting_weaving', 'Textile & Leather', 'Knitting & Weaving', 'Fabric production and textile manufacturing', 100, 20, '{
  "required": ["fabric_type", "yarn_specification", "width"],
  "optional": ["weight", "finish", "pattern"],
  "fabric_types": ["Knitted", "Woven", "Non-woven"],
  "yarns": ["Cotton", "Polyester", "Wool", "Blends", "Technical yarns"],
  "widths": ["150cm", "180cm", "220cm", "Custom"]
}'),

('leather_goods', 'Textile & Leather', 'Leather Goods Manufacturing', 'Bags, belts, wallets, and accessories', 20, 18, '{
  "required": ["product_type", "leather_type", "quality_grade"],
  "optional": ["hardware", "lining", "customization"],
  "product_types": ["Bags", "Belts", "Wallets", "Accessories", "Footwear"],
  "leather_types": ["Genuine leather", "PU leather", "Synthetic"],
  "grades": ["Top grain", "Full grain", "Split leather"]
}'),

('upholstery', 'Textile & Leather', 'Upholstery Jobwork', 'Automotive and furniture upholstery', 10, 12, '{
  "required": ["application", "material_type", "pattern"],
  "optional": ["foam_type", "stitching_style", "trim"],
  "applications": ["Automotive", "Furniture", "Marine", "Aviation"],
  "materials": ["Leather", "Vinyl", "Fabric", "Technical textiles"],
  "features": ["Fire retardant", "Water resistant", "UV resistant"]
}'),

-- Construction & Infrastructure
('structural_steel', 'Construction & Infrastructure', 'Structural Steel Fabrication', 'Building and infrastructure steel work', 1, 21, '{
  "required": ["steel_grade", "structure_type", "drawings"],
  "optional": ["surface_treatment", "welding_certification", "erection"],
  "steel_grades": ["IS2062", "IS800", "ASTM A36", "ASTM A572"],
  "structure_types": ["Beams", "Columns", "Trusses", "Frames"],
  "treatments": ["Galvanizing", "Painting", "Fireproofing"]
}'),

('prefab_modules', 'Construction & Infrastructure', 'Prefab Modules', 'Site cabins, sheds, and modular structures', 1, 25, '{
  "required": ["module_type", "dimensions", "specifications"],
  "optional": ["insulation", "electrical", "plumbing"],
  "module_types": ["Site offices", "Toilets", "Stores", "Accommodation"],
  "materials": ["Steel frame", "Sandwich panels", "Container based"],
  "features": ["Insulated", "AC ready", "Furnished"]
}'),

('metal_joinery', 'Construction & Infrastructure', 'Metal Joinery & Welding', 'Custom metalwork and fabrication', 5, 14, '{
  "required": ["metal_type", "joinery_type", "finish"],
  "optional": ["installation", "hardware", "glass_work"],
  "metal_types": ["Aluminum", "Steel", "Stainless steel", "MS"],
  "joinery_types": ["Windows", "Doors", "Partitions", "Railings"],
  "finishes": ["Powder coating", "Anodizing", "Galvanizing"]
}'),

('carpentry_woodwork', 'Construction & Infrastructure', 'Carpentry & Woodwork', 'Custom furniture and wooden structures', 5, 18, '{
  "required": ["wood_type", "product_type", "finish"],
  "optional": ["hardware", "assembly", "installation"],
  "wood_types": ["Plywood", "MDF", "Solid wood", "Particle board"],
  "products": ["Furniture", "Cabinets", "Doors", "Paneling"],
  "finishes": ["Laminate", "Veneer", "Paint", "Polish"]
}'),

('stone_tile', 'Construction & Infrastructure', 'Stone & Tile Cutting', 'Natural stone and tile processing', 10, 10, '{
  "required": ["material_type", "processing_type", "dimensions"],
  "optional": ["surface_finish", "edge_treatment", "installation"],
  "materials": ["Granite", "Marble", "Sandstone", "Ceramic tiles"],
  "processing": ["Cutting", "Polishing", "Honing", "Flaming"],
  "thickness": ["10mm", "15mm", "20mm", "25mm", "30mm"]
}'),

('precast_concrete', 'Construction & Infrastructure', 'Precast Concrete Components', 'Concrete elements and structures', 1, 21, '{
  "required": ["component_type", "concrete_grade", "dimensions"],
  "optional": ["reinforcement", "surface_finish", "installation"],
  "components": ["Beams", "Columns", "Slabs", "Walls", "Custom"],
  "grades": ["M20", "M25", "M30", "M35", "M40"],
  "finishes": ["Smooth", "Textured", "Exposed aggregate"]
}'),

('facade_glass_aluminium', 'Construction & Infrastructure', 'Glass & Aluminium Facade', 'Building facade systems and glazing', 1, 30, '{
  "required": ["system_type", "glass_specification", "area"],
  "optional": ["thermal_performance", "safety_features", "automation"],
  "systems": ["Curtain wall", "Window wall", "Structural glazing"],
  "glass_types": ["Float glass", "Toughened", "Laminated", "Insulated"],
  "features": ["Thermal break", "Sound insulation", "Security"]
}');

-- Update the sequences to ensure proper auto-increment
SELECT setval(pg_get_serial_sequence('skus', 'id'), (SELECT MAX(id) FROM skus));
