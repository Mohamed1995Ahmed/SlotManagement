using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SlotBooking.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppSlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartInstant = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndInstant = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreationTimeZone = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ExtraProperties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSlots", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppSlots_StartInstant",
                table: "AppSlots",
                column: "StartInstant");

            migrationBuilder.CreateIndex(
                name: "IX_AppSlots_Status",
                table: "AppSlots",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppSlots");
        }
    }
}
